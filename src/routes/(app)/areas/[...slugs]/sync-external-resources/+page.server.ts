import { getBlocksOfArea } from '$lib/blocks.server'
import { db } from '$lib/db/db.server'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { inArray } from 'drizzle-orm'
import { routeExternalResources } from '$lib/db/schema'

export const load = (async ({ locals, parent }) => {
  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  if (locals.user == null) {
    // If the user is not authenticated, throw a 401 error
    error(401)
  }

  const { area, blocks } = await getBlocksOfArea(areaId, db)

  const routes = blocks.flatMap((block) => block.routes)

  const externalResources = await db.query.routeExternalResources.findMany({
    where: inArray(
      routeExternalResources.routeFk,
      routes.map((route) => route.id),
    ),
    with: {
      externalResource8a: true,
      externalResource27crags: true,
      externalResourceTheCrag: true,
    },
  })

  return { area, blocks, externalResources }
}) satisfies PageServerLoad
