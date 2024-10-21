import { db } from '$lib/db/db.server'
import { areas, blocks, users, type UserSettings } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock, enrichTopo } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import remarkHtml from 'remark-html'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
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
  const session = await locals.auth()

  const { areaId } = convertAreaSlug(params)

  const grades = await db.query.grades.findMany()

  let gradingScale: UserSettings['gradingScale'] = 'FB'

  if (session?.user?.email != null) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      with: {
        userSettings: {
          columns: {
            gradingScale: true,
          },
        },
      },
    })

    gradingScale = user?.userSettings?.gradingScale ?? gradingScale
  }

  const areasResult = await db.query.areas.findMany({
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
  })

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const allBlocks = [...area.blocks, ...area.areas.flatMap((area) => area.blocks)]

  const enrichedBlocks = await Promise.all(
    allBlocks.map(async (block) => {
      const toposResult = await Promise.all(block.topos.map((topo) => enrichTopo(topo, session)))
      const enrichedBlock = enrichBlock(block)

      return {
        ...block,
        ...enrichedBlock,
        topos: toposResult,
      }
    }),
  )

  // Process area description from markdown to HTML if description is present
  let description = area.description
  if (description != null) {
    const result = await unified().use(remarkParse).use(remarkHtml).process(description)
    description = result.value as string
  }

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
