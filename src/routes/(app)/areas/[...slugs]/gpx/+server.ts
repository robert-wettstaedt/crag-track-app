import { EXPORT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { convertException } from '$lib/errors'
import { getAreaGPX } from '$lib/gpx.server'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'

export async function GET({ locals, params }) {
  if (!locals.userPermissions?.includes(EXPORT_PERMISSION)) {
    error(404)
  }

  const rls = await createDrizzleSupabaseClient(locals.supabase)

  return await rls(async (db) => {
    try {
      const { areaId } = convertAreaSlug(params)

      const xml = await getAreaGPX(areaId, db, locals.session)

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    } catch (exception) {
      error(404, `Unable to export GPX: ${convertException(exception)}`)
    }
  })
}
