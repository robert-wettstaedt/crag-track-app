import { NEXTCLOUD_URL, NEXTCLOUD_USER_NAME, NEXTCLOUD_USER_PASSWORD } from '$env/static/private'
import * as schema from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { error } from '@sveltejs/kit'
import { createClient, type FileStat, type WebDAVClient } from 'webdav'
import type { FileDTO } from '.'

/**
 * Creates a WebDAV client for Nextcloud using the provided session and path.
 *
 * @param {string} [path='/remote.php/dav/files'] - The path to the WebDAV endpoint.
 * @returns {WebDAVClient} - The WebDAV client configured for Nextcloud.
 * @throws {Error} - Throws an error if the session is invalid or missing required information.
 */
export const getNextcloud = (path = '/remote.php/dav/files'): WebDAVClient => {
  return createClient(NEXTCLOUD_URL + path, {
    username: NEXTCLOUD_USER_NAME,
    password: NEXTCLOUD_USER_PASSWORD,
  })
}

/**
 * Searches for a file in Nextcloud using the provided session and file information.
 *
 * @param {schema.File} file - The file object containing the path to search for.
 * @returns {Promise<FileStat>} - A promise that resolves to the file statistics if found.
 * @throws {Error} - Throws an error if the session is invalid, the file is not found, or there is an issue with the search request.
 */
export const searchNextcloudFile = async (file: schema.File): Promise<FileStat> => {
  try {
    const stat = (await getNextcloud().stat(NEXTCLOUD_USER_NAME + file.path)) as FileStat

    return { ...stat, filename: stat.filename.replace(`/${NEXTCLOUD_USER_NAME}`, '') }
  } catch (exception) {
    const { response, status } = exception as { response: Response | undefined; status: number | undefined }

    if (response != null && typeof status === 'number') {
      const msg = await response.text()
      error(status, msg)
    }

    error(400, `File with id "${file.id}" not found`)
  }
}

/**
 * Loads file information from Nextcloud for a given list of files.
 *
 * @param {schema.File[]} files - The list of files to load information for.
 * @returns {Promise<FileDTO[]>} A promise that resolves to an array of FileDTO objects containing file information.
 */
export const loadFiles = (files: schema.File[]): Promise<FileDTO[]> => {
  return Promise.all(
    files.map(async (file) => {
      try {
        const stat = await searchNextcloudFile(file)
        return { ...file, error: undefined, stat }
      } catch (exception) {
        return { ...file, error: convertException(exception), stat: undefined }
      }
    }),
  )
}

export const mkDir = async (path: string): Promise<string> => {
  const nextcloud = getNextcloud()

  const segments = path.split('/')

  for (let i = 1; i <= segments.length; i++) {
    const segment = segments.slice(0, i).join('/')

    if (!(await nextcloud.exists(NEXTCLOUD_USER_NAME + segment))) {
      await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + segment)
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  return path
}

export const deleteFile = async (file: schema.File) => {
  const nextcloud = getNextcloud()

  const [filename, ...pathSegments] = file.path.split('/').reverse()
  const path = pathSegments.reverse().join('/')
  const basename = filename.split('.').slice(0, -1).join('.')

  const contents = await nextcloud.getDirectoryContents(NEXTCLOUD_USER_NAME + path, { glob: `${basename}.*` })

  if (Array.isArray(contents)) {
    await Promise.all(contents.map((content) => nextcloud.deleteFile(content.filename)))
  }
}
