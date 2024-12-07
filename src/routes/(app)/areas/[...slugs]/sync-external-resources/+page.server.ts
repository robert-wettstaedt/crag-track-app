import { getBlocksOfArea } from '$lib/blocks.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { routeExternalResources } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { inArray } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.user?.appPermissions?.includes('data.edit')) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  if (locals.user == null) {
    // If the user is not authenticated, throw a 401 error
    error(401)
  }

  const { area, blocks } = await db((tx) => getBlocksOfArea(areaId, tx))

  const routes = blocks.flatMap((block) => block.routes)

  const externalResources = await db((tx) =>
    tx.query.routeExternalResources.findMany({
      where: inArray(
        routeExternalResources.routeFk,
        routes.map((route) => route.id),
      ),
      with: {
        externalResource8a: true,
        externalResource27crags: true,
        externalResourceTheCrag: true,
      },
    }),
  )

  return { area, blocks, externalResources }
}) satisfies PageServerLoad
