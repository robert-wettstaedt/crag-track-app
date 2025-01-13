import { enhance } from '$app/forms'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { config } from '$lib/config'
import type { Action } from 'svelte/action'
import * as tus from 'tus-js-client'

interface EnhanceFileUploadOptions extends Pick<App.Locals, 'session' | 'supabase' | 'user'> {
  onError?: (error: string) => void
  onProgress?: (percentage: number) => void
  onSubmit?: Parameters<typeof enhance>[1]
}

export const enhanceWithFile: Action<HTMLFormElement, EnhanceFileUploadOptions> = (node, parameters) => {
  const { onError, onSubmit, onProgress, session, supabase, user } = parameters

  const enhanced = enhance(node, async (event) => {
    const result = await onSubmit?.(event)
    const returnValue: ReturnType<NonNullable<EnhanceFileUploadOptions['onSubmit']>> = async (event) => {
      return result?.(event)
    }

    const files = event.formData
      .getAll('files')
      .filter((file) => file instanceof File)
      .filter((file) => file.size > 0)

    if (files.some((file) => file.size > config.files.maxSize.number)) {
      const error = `File size exceeds the maximum allowed size (${config.files.maxSize.human})`
      onError?.(error)
      throw error
    }

    // eslint-disable-next-line drizzle/enforce-delete-with-where
    event.formData.delete('files')

    let folderName = event.formData.get('folderName')

    if (session == null || user == null || files.length === 0) {
      return returnValue
    }

    if (typeof folderName === 'string' && folderName.length > 0) {
      return returnValue
    }

    folderName = `${user.id}-${Date.now()}`
    event.formData.set('folderName', folderName)

    await Promise.all(
      files.map(async (file) => {
        try {
          await uploadTus(file, session.access_token, folderName, onProgress)
        } catch (exception) {
          const { error } = await supabase.storage.from('uploads').upload(`${folderName}/${file.name}`, file)

          if (error != null) {
            onError?.(error.message)
            throw error
          }
        }
      }),
    )

    return returnValue
  })

  return {
    destroy: () => {
      enhanced.destroy()
    },
  }
}

const uploadTus = async (
  file: File,
  token: string,
  folderName: string,
  onProgress?: EnhanceFileUploadOptions['onProgress'],
) => {
  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${token}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
      metadata: {
        bucketName: 'uploads',
        objectName: `${folderName}/${file.name}`,
        contentType: file.type,
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
      onError: function (error) {
        reject(error)
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal) * 100
        onProgress?.(percentage)
      },
      onSuccess: function () {
        resolve(null)
      },
    })

    // Check if there are any previous uploads to continue.
    return upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }

      // Start the upload
      upload.start()
    })
  })
}
