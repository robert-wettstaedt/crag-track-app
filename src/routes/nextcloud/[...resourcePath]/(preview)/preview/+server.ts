import { NEXTCLOUD_URL, NEXTCLOUD_USER_NAME, NEXTCLOUD_USER_PASSWORD } from '$env/static/private'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import { type Headers } from 'webdav'

export async function GET({ locals, request, params, url }) {
  if (!locals.userPermissions?.includes('data.read')) {
    return new Response(null, { status: 404 })
  }

  // Extract relevant headers from the request
  const reqHeaders = Array.from(request.headers.entries()).reduce(
    (headers, [key, value]) => {
      // Include only 'accept' and 'range' headers
      if (['accept', 'range'].includes(key.toLowerCase())) {
        return { ...headers, [key]: value }
      }
      return headers
    },
    { Authorization: `Basic ${btoa(`${NEXTCLOUD_USER_NAME}:${NEXTCLOUD_USER_PASSWORD}`)}` } as Headers,
  )

  const file = await searchNextcloudFile({
    areaFk: null,
    ascentFk: null,
    blockFk: null,
    id: 0,
    path: '/' + params.resourcePath,
    routeFk: null,
  })

  const searchParams = new URLSearchParams(url.searchParams)
  searchParams.set('fileId', String(file.props?.fileid ?? ''))

  const result = await fetch(`${NEXTCLOUD_URL}/core/preview?${searchParams}`, {
    headers: reqHeaders,
    signal: request.signal,
  })

  const resHeaders = new Headers(result.headers)
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  resHeaders.delete('Set-Cookie')
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  resHeaders.delete('Content-Encoding')

  return new Response(result.body, {
    headers: resHeaders,
    status: result.status,
    statusText: result.statusText,
  })
}
