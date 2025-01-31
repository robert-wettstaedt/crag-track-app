import { READ_PERMISSION } from '$lib/auth'
import { load } from '$lib/components/AscentsTable/load.server'

export const GET = async (event) => {
  if (!event.locals.userPermissions?.includes(READ_PERMISSION)) {
    return new Response(null, { status: 404 })
  }

  const data = await load(event)
  return new Response(JSON.stringify(data), { status: 200 })
}
