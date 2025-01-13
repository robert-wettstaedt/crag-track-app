import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, blocks, routes } from '$lib/db/schema'
import { enrichTopo, sortRoutesByTopo } from '$lib/db/utils'
import { getReferences } from '$lib/references.server'
import { error } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug, user } = await parent()

  // Query the database for blocks matching the given slug and areaId
  const blocksResult = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        author: true,
        geolocation: true,
        routes: {
          orderBy: routes.gradeFk,
          with: {
            ascents: user == null ? { limit: 0 } : { where: eq(ascents.createdBy, user.id) },
          },
        },
        topos: {
          with: {
            file: true,
            routes: true,
          },
        },
      },
    }),
  )

  // Get the first block from the result
  const block = blocksResult.at(0)

  // If no block is found, throw a 404 error
  if (block == null) {
    error(404)
  }

  // If more than one block is found, throw a 400 error
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo)))
  const sortedRoutes = sortRoutesByTopo(block.routes, topos)

  // Return the block, enriched geolocation blocks, and processed files
  return {
    block: { ...block, routes: sortedRoutes },
    references: getReferences(block.id, 'blocks'),
    topos,
  }
}) satisfies PageServerLoad
