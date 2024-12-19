import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { convertException } from '$lib/errors'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import type { FileStat } from 'webdav'

export async function GET({ locals, url }) {
  if (!locals.userPermissions?.includes('data.read')) {
    return new Response(null, { status: 404 })
  }

  const dir = url.searchParams.get('dir') ?? '/'

  const nextcloud = getNextcloud()

  try {
    const stats = await nextcloud.getDirectoryContents(NEXTCLOUD_USER_NAME + dir)
    const modifiedStats = (stats as Array<FileStat>).map((stat) => ({
      ...stat,
      filename: stat.filename.replace(`/${NEXTCLOUD_USER_NAME}`, ''),
    }))
    return new Response(JSON.stringify(modifiedStats))
  } catch (exception) {
    return new Response(convertException(exception), { status: 500 })
  }
}
