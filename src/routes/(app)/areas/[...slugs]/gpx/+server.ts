import { db } from '$lib/db/db.server'
import { getAreaGPX } from '$lib/gpx.server'
import { convertAreaSlug } from '$lib/helper.server'

export async function GET({ locals, params }) {
  const session = await locals.auth()

  const { areaId } = convertAreaSlug(params)

  const xml = await getAreaGPX(areaId, db, session)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
