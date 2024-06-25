import { NEXTCLOUD_URL } from '$env/static/private'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server.js'
import { error } from '@sveltejs/kit'
import { type Headers } from 'webdav'

export async function GET({ locals, request, params, url }) {
  // Authenticate the user session
  const session = await locals.auth()

  // If the user is not authenticated, throw a 401 error
  if (session?.user == null) {
    error(401)
  }

  // Extract relevant headers from the request
  const headers = Array.from(request.headers.entries()).reduce(
    (headers, [key, value]) => {
      // Include only 'accept' and 'range' headers
      if (['accept', 'range'].includes(key.toLowerCase())) {
        return { ...headers, [key]: value }
      }
      return headers
    },
    { Authorization: `Bearer ${session.accessToken}` } as Headers,
  )

  const file = await searchNextcloudFile(session, {
    areaFk: null,
    ascentFk: null,
    blockFk: null,
    id: 0,
    path: params.resourcePath,
    routeFk: null,
    type: 'other',
  })

  const searchParams = new URLSearchParams(url.searchParams)
  searchParams.set('fileId', String(file.props?.fileid ?? ''))

  const result = await fetch(`${NEXTCLOUD_URL}/core/preview?${searchParams}`, {
    headers,
    signal: request.signal,
  })

  return new Response(result.body, {
    headers: result.headers,
    status: result.status,
    statusText: result.statusText,
  })
}
