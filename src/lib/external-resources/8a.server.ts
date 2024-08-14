import { db, keyv } from '$lib/db/db.server.js'
import { generateSlug, routeExternalResource8a } from '$lib/db/schema'
import { type RouteExternalResource8a } from '$lib/db/schema.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ExternalResourceHandler } from './index.server'

const QueryResponse8a = z.object({
  items: z.array(
    z.object({
      areaName: z.union([z.string(), z.null()]),
      areaSlug: z.union([z.string(), z.null()]),
      averageRating: z.number(),
      category: z.number(),
      countryName: z.string(),
      countrySlug: z.string(),
      cragName: z.string(),
      cragSlug: z.string(),
      difficulty: z.string(),
      flashOnsightRate: z.number(),
      gradeIndex: z.number(),
      score: z.number(),
      sectorName: z.string(),
      sectorSlug: z.string(),
      totalAscents: z.number(),
      totalRecommendedRate: z.number(),
      type: z.number(),
      zlaggableId: z.number(),
      zlaggableName: z.string(),
      zlaggableSlug: z.string(),
    }),
  ),
})

type QueryResponse8a = z.infer<typeof QueryResponse8a>

export default {
  postUrl: 'https://www.8a.nu/api/ascents',

  query: async (query, blockId, crag, sector) => {
    const cacheKey = `8a-${blockId}-${generateSlug(query)}`

    const extendedQuery = `${query}+${crag?.name ?? ''}`

    const searchParams = new URLSearchParams({
      query: extendedQuery,
      pageIndex: '0',
      pageSize: '20',
      'entityTypes[]': '3',
      showOnMap: 'false',
    })

    try {
      if (await keyv.has(cacheKey)) {
        return keyv.get(cacheKey)
      }

      const url = `https://www.8a.nu/unificationAPI/collection/v1/web/search?${searchParams.toString()}`
      const response = await fetch(url)
      const data = await response.json()

      const parsed = QueryResponse8a.parse(data)
      const item = parsed.items
        .filter(
          (item) =>
            generateSlug(item.zlaggableName) === generateSlug(query) &&
            (generateSlug(item.cragName) === crag?.slug ||
              generateSlug(item.cragSlug) === crag?.slug ||
              generateSlug(item.sectorName) === sector?.slug ||
              generateSlug(item.sectorSlug) === sector?.slug),
        )
        .toSorted((a, b) => b.totalAscents - a.totalAscents)
        .at(0)

      if (item != null) {
        const data: RouteExternalResource8a = {
          ...item,
          externalResourcesFk: -1,
          id: -1,
          url: `https://www.8a.nu/crags/bouldering/${item.countrySlug}/${item.cragSlug}/sectors/${item.sectorSlug}/routes/${item.zlaggableSlug}`,
        }

        await keyv.set(cacheKey, data)

        return data
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2))
    }

    return null
  },

  convertToRoute: (data) => {
    return {
      blockFk: -1,
      createdAt: '',
      createdBy: -1,
      description: null,
      externalResourcesFk: null,
      firstAscentFk: null,
      grade: data.difficulty ?? null,
      gradingScale: data.difficulty?.startsWith('V') ? 'V' : 'FB',
      id: data.zlaggableId ?? -1,
      name: data.zlaggableName ?? '',
      rating: Math.round(((data.averageRating ?? 0) / 5) * 3),
      slug: data.zlaggableSlug ?? '',
    }
  },

  /**
   * Intentionally send a post request to the 8a API without the body.
   * If the session is valid, the server will respond with a 400 status code.
   * If the session is invalid, the server will respond with a 401 status code.
   */
  checkSession: async function (_, userExternalResource) {
    if (userExternalResource.cookie8a == null) {
      return null
    }

    const res = await fetch(this.postUrl ?? '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `connect.sid=${userExternalResource.cookie8a}`,
      },
    })

    if (res.status === 400) {
      return true
    }

    if (res.status === 401) {
      throw new Error('Your 8a session is invalid')
    }

    const json = await res.json()
    console.log(`Failed checkSession POST ${this.postUrl}`)
    console.log(json)
    throw new Error(`Failed 8a session check: ${res.status} ${res.statusText}`)
  },

  logAscent: async function (ascent, externalResourceId, userExternalResource) {
    const externalResource =
      externalResourceId == null
        ? null
        : await db.query.routeExternalResource8a.findFirst({
            where: eq(routeExternalResource8a.id, externalResourceId),
          })

    if (externalResource == null || userExternalResource.cookie8a == null) {
      return
    }

    const type = (() => {
      switch (ascent.type) {
        case 'attempt':
          return 'go'

        case 'flash':
          return 'f'

        default:
          return 'rp'
      }
    })()

    const res = await fetch(this.postUrl ?? '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `connect.sid=${userExternalResource.cookie8a}`,
      },
      body: JSON.stringify({
        zlaggable: {
          category: externalResource.category,
          areaName: externalResource.areaName,
          areaSlug: externalResource.areaSlug,
          countrySlug: externalResource.countrySlug,
          cragSlug: externalResource.cragSlug,
          cragName: externalResource.cragName,
          sectorSlug: externalResource.sectorSlug,
          sectorName: externalResource.sectorName,
          zlaggableSlug: externalResource.zlaggableSlug,
          zlaggableName: externalResource.zlaggableName,
        },
        ascent: {
          type,
          date: ascent.dateTime,
          comment: ascent.notes ?? '',
          repeat: ascent.type === 'repeat' ? true : false,

          gradeProposal: {
            isHard: false,
            isSoft: false,
            refinement: '',
            gradeIndex: externalResource.gradeIndex,
          },

          ascentId: 0,
          platform: 'eight_a',
          subType: null,
          tries: 0,
          isPrivateComment: false,
          isPublicComment: false,
          duplicate: false,
          traditional: false,
          rating: 0,
          recommend: false,
          typeOfClimbing: {
            athletic: false,
            cruxy: false,
            sloper: false,
            crimpy: false,
            technical: false,
            endurance: false,
          },
          steepness: {
            overhang: false,
            vertical: false,
            slab: false,
            roof: false,
          },
          safetyIssues: {
            badAnchor: false,
            badBolts: false,
            highFirstBolt: false,
            looseRock: false,
            badClippingPosition: false,
            reboltedByMe: false,
            anchorReplacedByMe: false,
          },
          safety: 2,
          Chipped: false,
          NoScore: false,
          firstAscent: false,
          withKneepad: false,
          project: false,
        },
      }),
    })

    if (res.status >= 400) {
      const json = await res.json()

      console.log(`Failed logAscent POST ${this.postUrl}`)
      console.log(json)
      throw new Error(`Unable to log 8a ascent: ${res.status} ${res.statusText}`)
    }
  },
} as ExternalResourceHandler<RouteExternalResource8a, true>
