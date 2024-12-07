import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { getAreaGPX } from '$lib/gpx.server'
import { convertAreaSlug } from '$lib/helper.server'

export async function GET({ locals, params }) {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const { areaId } = convertAreaSlug(params)

  const xml = await db((tx) => getAreaGPX(areaId, tx, locals.session))

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
