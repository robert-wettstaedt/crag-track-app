import { NEXTCLOUD_URL, NEXTCLOUD_USER_NAME, NEXTCLOUD_USER_PASSWORD } from '$env/static/private'
import * as schema from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { error } from '@sveltejs/kit'
import { createClient, type FileStat, type ResponseDataDetailed, type SearchResult, type WebDAVClient } from 'webdav'
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
  const basename = file.path.split('/').at(-1)

  try {
    const searchResult = await getNextcloud('/remote.php/dav').search('/', {
      details: true,
      data: `<?xml version="1.0" encoding="UTF-8"?>
<d:searchrequest xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
    <d:basicsearch>
        <d:select>
            <d:prop>
              <oc:fileid/>
              <d:displayname/>
              <d:getcontenttype/>
              <d:getetag/>
              <oc:size/>
            </d:prop>
        </d:select>
        <d:from>
            <d:scope>
                <d:href>/files/${NEXTCLOUD_USER_NAME}</d:href>
                <d:depth>infinity</d:depth>
            </d:scope>
        </d:from>
        <d:where>
            <d:like>
                <d:prop>
                    <d:displayname/>
                </d:prop>
                <d:literal>${basename}</d:literal>
            </d:like>
        </d:where>
        <d:orderby/>
    </d:basicsearch>
</d:searchrequest>`,
    })

    const stat = (searchResult as ResponseDataDetailed<SearchResult>).data.results.find((result) =>
      result.filename.includes(file.path),
    )

    if (stat == null) {
      error(404)
    }

    return { ...stat, filename: stat.filename.replace(`/remote.php/dav/files/${NEXTCLOUD_USER_NAME}`, '') }
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
