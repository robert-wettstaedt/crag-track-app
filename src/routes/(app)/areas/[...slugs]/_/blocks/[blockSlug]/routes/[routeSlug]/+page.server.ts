import { EDIT_PERMISSION } from '$lib/auth'
import { loadFeed } from '$lib/components/ActivityFeed/load.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, ascents, blocks } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import { insertExternalResources } from '$lib/external-resources/index.server'
import { convertAreaSlug, getRouteDbFilter } from '$lib/helper.server'
import { convertMarkdownToHtml } from '$lib/markdown'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error } from '@sveltejs/kit'
import { and, desc, eq, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the block and its associated routes
  const block = await db((tx) =>
    tx.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          where: getRouteDbFilter(params.routeSlug),
          with: {
            author: true,
            ascents: {
              orderBy: desc(ascents.dateTime),
              with: {
                author: true,
                route: true,
              },
            },
            files: true,
            firstAscent: {
              with: {
                climber: true,
              },
            },
            tags: true,
            externalResources: {
              with: {
                externalResource8a: true,
                externalResource27crags: true,
                externalResourceTheCrag: true,
              },
            },
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

  // Get the first route from the block's routes
  const route = block?.routes?.at(0)

  // Handle case where route is not found
  if (block == null || route == null) {
    error(404)
  }

  // Handle case where multiple routes with the same slug are found
  if (block.routes.length > 1) {
    error(400, `Multiple routes with slug ${params.routeSlug} found`)
  }

  // Fetch and enrich files associated with the route
  const routeFiles = await loadFiles(route.files)

  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo)))

  // Process route description from markdown to HTML if description is present
  const description = await db(async (tx) =>
    route.description == null ? null : convertMarkdownToHtml(route.description, tx),
  )

  const feed = await loadFeed({ locals, url }, [
    or(
      and(eq(activities.entityId, route.id), eq(activities.entityType, 'route')),
      and(eq(activities.parentEntityId, route.id), eq(activities.parentEntityType, 'route')),
    )!,
  ])

  // Return the enriched data
  return {
    route: { ...route, description },
    files: routeFiles,
    references: getReferences(route.id, 'routes'),
    topos,
    feed,
  }
}) satisfies PageServerLoad

export const actions = {
  syncExternalResources: async ({ locals, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    const { areaId } = convertAreaSlug(params)

    // Query the database to find the block and its associated routes
    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
        with: {
          routes: {
            where: getRouteDbFilter(params.routeSlug),
          },
        },
      }),
    )

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Handle case where route is not found
    if (block == null || route == null) {
      error(404)
    }

    await insertExternalResources(route, block, locals)
  },
}
