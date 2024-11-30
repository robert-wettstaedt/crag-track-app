import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { convertException } from '$lib'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error } from '@sveltejs/kit'
import type { FileStat } from 'webdav'

export async function GET({ locals, url }) {
  const session = await locals.auth()

  if (session?.user == null) {
    error(401)
  }

  const dir = url.searchParams.get('dir') ?? '/'

  const nextcloud = getNextcloud(session)

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
