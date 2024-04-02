import { NEXTCLOUD_URL } from '$env/static/private'
import type { File } from '$lib/db/schema'
import type { Session } from '@auth/sveltekit'
import { AuthType, createClient, type WebDAVClient } from 'webdav'

export const getNextcloud = (session: Session | null | undefined): WebDAVClient | undefined => {
  if (session?.user?.email == null || session?.accessToken == null) {
    return undefined
  }

  return createClient(NEXTCLOUD_URL + '/remote.php/dav/files/', {
    authType: AuthType.Token,
    token: {
      access_token: session.accessToken,
      token_type: 'Bearer',
    },
  })
}

export const getFileContents = async (session: Session | null | undefined, file: File): Promise<string | undefined> => {
  if (session?.user?.email == null || session?.accessToken == null) {
    return undefined
  }

  const nextcloud = createClient(NEXTCLOUD_URL + '/remote.php/dav/files/', {
    authType: AuthType.Token,
    token: {
      access_token: session.accessToken,
      token_type: 'Bearer',
    },
  })

  const contents = await nextcloud.getFileContents(file.path)

  if (contents instanceof Buffer) {
    return contents.toString('base64')
  }
}
