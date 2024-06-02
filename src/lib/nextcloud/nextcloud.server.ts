import { NEXTCLOUD_URL } from '$env/static/private'
import type { File } from '$lib/db/schema'
import type { Session } from '@auth/sveltekit'
import { error } from '@sveltejs/kit'
import { AuthType, createClient, type FileStat, type SearchResult, type WebDAVClient } from 'webdav'

/**
 * Creates a WebDAV client for Nextcloud using the provided session and path.
 *
 * @param {Session | null | undefined} session - The session object containing user information and access token.
 * @param {string} [path='/remote.php/dav/files'] - The path to the WebDAV endpoint.
 * @returns {WebDAVClient} - The WebDAV client configured for Nextcloud.
 * @throws {Error} - Throws an error if the session is invalid or missing required information.
 */
export const getNextcloud = (session: Session | null | undefined, path = '/remote.php/dav/files'): WebDAVClient => {
  if (session?.user?.email == null || session?.accessToken == null) {
    error(401)
  }

  return createClient(NEXTCLOUD_URL + path, {
    authType: AuthType.Token,
    token: {
      access_token: session.accessToken,
      token_type: 'Bearer',
    },
  })
}

/**
 * Searches for a file in Nextcloud using the provided session and file information.
 *
 * @param {Session | null | undefined} session - The session object containing user information and access token.
 * @param {File} file - The file object containing the path to search for.
 * @returns {Promise<FileStat>} - A promise that resolves to the file statistics if found.
 * @throws {Error} - Throws an error if the session is invalid, the file is not found, or there is an issue with the search request.
 */
export const searchNextcloudFile = async (session: Session | null | undefined, file: File): Promise<FileStat> => {
  if (session?.user?.email == null || session?.accessToken == null) {
    error(401)
  }

  const basename = file.path.split('/').at(-1)

  try {
    const searchResult = await getNextcloud(session, '/remote.php/dav').search('/', {
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
                <d:href>/files/${session.user.email}</d:href>
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

    const stat = (searchResult as SearchResult).results.find((result) => result.filename.includes(file.path))

    if (stat == null) {
      error(404)
    }

    return { ...stat, filename: stat.filename.replace('/remote.php/dav/files', '') }
  } catch (exception) {
    const { response, status } = exception as { response: Response | undefined; status: number | undefined }

    if (response != null && typeof status === 'number') {
      const msg = await response.text()
      error(status, msg)
    }

    error(400, `File with id "${file.id}" not found`)
  }
}
