import { EDIT_PERMISSION } from '$lib/auth'
import { loadFeed } from '$lib/components/ActivityFeed/load.server'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, ascents, blocks, firstAscensionists, routesToFirstAscensionists, users } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import { insertExternalResources } from '$lib/external-resources/index.server'
import { convertAreaSlug, getRouteDbFilter, getUser } from '$lib/helper.server'
import { convertMarkdownToHtml } from '$lib/markdown'
import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error } from '@sveltejs/kit'
import { and, desc, eq, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'
import { convertException } from '$lib/errors'

export const load = (async ({ locals, params, parent, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the block and its associated routes
  const block = await db((tx) =>
    tx.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        geolocation: true,
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
            firstAscents: {
              with: {
                firstAscensionist: {
                  with: {
                    user: true,
                  },
                },
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
    block,
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

  claimFirstAscensionist: async ({ locals, params, request }) => {
    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Retrieve form data from the request
    const data = await request.formData()
    const firstAscensionistFk = data.get('firstAscensionistFk')

    // Query the database to find the block with the specified slug and areaId
    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
        with: {
          routes: {
            // Filter the routes to find the one with the specified slug
            where: getRouteDbFilter(params.routeSlug),
            with: {
              firstAscents: {
                with: {
                  firstAscensionist: true,
                },
              },
            },
          },
        },
      }),
    )

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 error if the route is not found
    if (route == null) {
      return fail(404, { error: `Route not found ${params.routeSlug}` })
    }

    // Return a 400 error if multiple routes with the same slug are found
    if (block != null && block.routes.length > 1) {
      return fail(400, { error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    const firstAscensionist = await db(async (tx) =>
      firstAscensionistFk == null
        ? null
        : tx.query.firstAscensionists.findFirst({
            where: eq(firstAscensionists.id, Number(firstAscensionistFk)),
          }),
    )

    if (firstAscensionist == null) {
      return fail(404)
    }

    if (firstAscensionist.userFk != null || user?.firstAscensionistFk != null) {
      return fail(400)
    }

    try {
      user!.firstAscensionistFk = firstAscensionist.id
      await db((tx) =>
        tx.update(users).set({ firstAscensionistFk: firstAscensionist.id }).where(eq(users.id, user!.id)),
      )
      await db((tx) =>
        tx.update(firstAscensionists).set({ userFk: user!.id }).where(eq(firstAscensionists.id, firstAscensionist.id)),
      )

      await db(async (tx) =>
        user == null || block == null
          ? null
          : tx.insert(activities).values({
              type: 'updated',
              userFk: user.id,
              entityId: user.id,
              entityType: 'user',
              columnName: 'first ascensionist',
              newValue: firstAscensionist.name,
            }),
      )
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }
  },

  claimFirstAscent: async ({ locals, params }) => {
    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Query the database to find the block with the specified slug and areaId
    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
        with: {
          routes: {
            // Filter the routes to find the one with the specified slug
            where: getRouteDbFilter(params.routeSlug),
            with: {
              firstAscents: {
                with: {
                  firstAscensionist: true,
                },
              },
            },
          },
        },
      }),
    )

    // Get the first route from the block's routes
    const route = block?.routes?.at(0)

    // Return a 404 error if the route is not found
    if (route == null) {
      return fail(404, { error: `Route not found ${params.routeSlug}` })
    }

    // Return a 400 error if multiple routes with the same slug are found
    if (block != null && block.routes.length > 1) {
      return fail(400, { error: `Multiple routes with slug ${params.routeSlug} found` })
    }

    if (route.firstAscents.length > 0) {
      return fail(400, { error: `Route already has a first ascent` })
    }

    if (user?.firstAscensionistFk == null) {
      return fail(400, { error: `User does not have a first ascensionist` })
    }

    try {
      const firstAscensionist = await db(async (tx) =>
        user?.firstAscensionistFk == null
          ? (await tx.insert(firstAscensionists).values({ name: user!.username, userFk: user!.id }).returning()).at(0)
          : tx.query.firstAscensionists.findFirst({ where: eq(firstAscensionists.id, user!.firstAscensionistFk!) }),
      )

      if (firstAscensionist == null) {
        return fail(404)
      }

      if (user?.firstAscensionistFk == null) {
        user!.firstAscensionistFk = firstAscensionist.id
        await db((tx) =>
          tx.update(users).set({ firstAscensionistFk: firstAscensionist.id }).where(eq(users.id, user!.id)),
        )
      }

      await db(
        async (tx) =>
          await tx
            .insert(routesToFirstAscensionists)
            .values({ firstAscensionistFk: user!.firstAscensionistFk!, routeFk: route.id }),
      )

      const oldFirstAscent = [route.firstAscentYear, ...route.firstAscents.map((fa) => fa.firstAscensionist.name)]
        .filter(Boolean)
        .join(' ')
      const newFirstAscent = [route.firstAscentYear, firstAscensionist.name].filter(Boolean).join(' ')

      await db(async (tx) =>
        user == null || block == null
          ? null
          : tx.insert(activities).values({
              type: 'updated',
              userFk: user.id,
              entityId: route.id,
              entityType: 'route',
              columnName: 'first ascent',
              oldValue: oldFirstAscent,
              newValue: newFirstAscent,
              parentEntityId: block.id,
              parentEntityType: 'block',
            }),
      )
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }
  },
}
