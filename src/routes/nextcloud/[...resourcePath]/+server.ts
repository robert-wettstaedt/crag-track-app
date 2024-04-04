import { getNextcloud } from '$lib/nextcloud/nextcloud.server.js'
import { error } from '@sveltejs/kit'
import { type BufferLike, type Headers, type ResponseDataDetailed } from 'webdav'

export async function GET({ locals, request, params }) {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const headers = Array.from(request.headers.entries()).reduce((headers, [key, value]) => {
    if (['accept', 'range'].includes(key.toLowerCase())) {
      return { ...headers, [key]: value }
    }

    return headers
  }, {} as Headers)

  const result = await getNextcloud(session)?.getFileContents(params.resourcePath, {
    details: true,
    headers,
    signal: request.signal,
  })

  const { data, ...rest } = result as ResponseDataDetailed<BufferLike>
  return new Response(data, rest)
}
