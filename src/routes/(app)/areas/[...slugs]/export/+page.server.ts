import { createDrizzleSupabaseClient, db } from '$lib/db/db.server'
import { areas, blocks, users, type UserSettings } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock, enrichTopo } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { convertMarkdownToHtml } from '$lib/markdown'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

const blocksQuery: {
  area: Parameters<typeof db.query.areas.findMany>[0]
  geolocation: true
  routes: {
    with: {
      firstAscent: {
        with: {
          climber: true
        }
      }
      tags: true
    }
  }
  topos: {
    with: {
      file: true
      routes: true
    }
  }
} = {
  area: buildNestedAreaQuery(2),
  geolocation: true,
  routes: {
    with: {
      firstAscent: {
        with: {
          climber: true,
        },
      },
      tags: true,
    },
  },
  topos: {
    with: {
      file: true,
      routes: true,
    },
  },
}

export const load = (async ({ locals, params }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const { areaId } = convertAreaSlug(params)

  const grades = await db((tx) => tx.query.grades.findMany())

  let gradingScale: UserSettings['gradingScale'] = 'FB'

  if (locals.user != null) {
    const user = await db((tx) =>
      tx.query.users.findFirst({
        where: eq(users.authUserFk, locals.user!.id),
        with: {
          userSettings: {
            columns: {
              gradingScale: true,
            },
          },
        },
      }),
    )

    gradingScale = user?.userSettings?.gradingScale ?? gradingScale
  }

  const areasResult = await db((tx) =>
    tx.query.areas.findMany({
      where: eq(areas.id, areaId),
      with: {
        author: true,
        blocks: {
          orderBy: blocks.name,
          with: blocksQuery,
        },
        areas: {
          orderBy: areas.name,
          with: {
            blocks: {
              orderBy: blocks.name,
              with: blocksQuery,
            },
          },
        },
        parkingLocations: true,
      },
    }),
  )

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const allBlocks = [...area.blocks, ...area.areas.flatMap((area) => area.blocks)]

  const enrichedBlocks = await Promise.all(
    allBlocks.map(async (block) => {
      const toposResult = await Promise.all(block.topos.map((topo) => enrichTopo(topo, locals.session)))
      const enrichedBlock = enrichBlock(block)

      const enrichedRoutes = await Promise.all(
        block.routes.map(async (route) => ({
          ...route,
          description: await db(async (tx) =>
            route.description == null ? null : convertMarkdownToHtml(route.description, tx, 'strong'),
          ),
        })),
      )

      return {
        ...block,
        ...enrichedBlock,
        routes: enrichedRoutes,
        topos: toposResult,
      }
    }),
  )

  const description = await db(async (tx) =>
    area.description == null ? null : convertMarkdownToHtml(area.description, tx, 'strong'),
  )

  return {
    area: {
      ...area,
      description,
      blocks: enrichedBlocks,
      areas: area.areas.map((area) => {
        return {
          ...area,
          blocks: enrichedBlocks.filter((block) => block.areaFk === area.id),
        }
      }),
    },
    grades,
    gradingScale,
  }
}) satisfies PageServerLoad
