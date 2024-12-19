import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { type BufferLike, type Headers, type ResponseDataDetailed } from 'webdav'

export async function GET({ locals, request, params }) {
  if (!locals.userPermissions?.includes('data.read')) {
    return new Response(null, { status: 404 })
  }

  // Extract relevant headers from the request
  const headers = Array.from(request.headers.entries()).reduce((headers, [key, value]) => {
    // Include only 'accept' and 'range' headers
    if (['accept', 'range'].includes(key.toLowerCase())) {
      return { ...headers, [key]: value }
    }
    return headers
  }, {} as Headers)

  // Fetch file contents from Nextcloud with detailed response
  const result = await getNextcloud()?.getFileContents(`${NEXTCLOUD_USER_NAME}/${params.resourcePath}`, {
    details: true,
    headers,
    signal: request.signal,
  })

  // Destructure the result to get data and other response details
  const { data, ...rest } = result as ResponseDataDetailed<BufferLike>

  // Return the response with the file data and additional details
  return new Response(data, rest)
}
