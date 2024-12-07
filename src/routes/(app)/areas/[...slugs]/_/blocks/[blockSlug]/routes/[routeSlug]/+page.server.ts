import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, blocks } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import { insertExternalResources } from '$lib/external-resources/index.server'
import { convertAreaSlug, getRouteDbFilter } from '$lib/helper.server'
import { convertMarkdownToHtml } from '$lib/markdown'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error } from '@sveltejs/kit'
import { and, desc, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
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
                files: true,
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
  const routeFiles = await loadFiles(route.files, locals.session)

  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo, locals.session)))

  // Enrich ascents with additional data and process notes
  const enrichedAscents = await Promise.all(
    route.ascents.map(async (ascent) => {
      const notes = await db(async (tx) => (ascent.notes == null ? null : convertMarkdownToHtml(ascent.notes, tx)))

      // Fetch and enrich files associated with the ascent
      const files = await loadFiles(
        ascent.files.toSorted((a, b) => a.path.localeCompare(b.path)),
        locals.session,
      )

      return {
        ...ascent,
        notes,
        files,
      }
    }),
  )

  // Process route description from markdown to HTML if description is present
  const description = await db(async (tx) =>
    route.description == null ? null : convertMarkdownToHtml(route.description, tx),
  )

  // Return the enriched data
  return {
    ascents: enrichedAscents,
    route: { ...route, description },
    files: routeFiles,
    references: getReferences(route.id, 'routes'),
    topos,
  }
}) satisfies PageServerLoad

export const actions = {
  syncExternalResources: async ({ locals, params }) => {
    if (!locals.user?.appPermissions?.includes('data.edit')) {
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
