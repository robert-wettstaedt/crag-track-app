import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { convertException } from '$lib/errors'
import { getAreaGPX } from '$lib/gpx.server'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'

export async function GET({ locals, params }) {
  try {
    const db = await createDrizzleSupabaseClient(locals.supabase)

    const { areaId } = convertAreaSlug(params)

    const xml = await db((tx) => getAreaGPX(areaId, tx, locals.session))

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  } catch (exception) {
    error(404, `Unable to export GPX: ${convertException(exception)}`)
  }
}
