import { db } from '$lib/db/db.server'
import { keyv } from '$lib/db/db.server.js'
import { generateSlug } from '$lib/db/schema'
import { routeExternalResource27crags, type Route, type RouteExternalResource27crags } from '$lib/db/schema.js'
import { parse } from 'cookie'
import { eq } from 'drizzle-orm'
import http from 'https'
import { z } from 'zod'
import type { ExternalResourceHandler } from './index.server'

export const QueryResponse27crags = z.object({
  search_keys: z.array(
    z.object({
      country_name: z.union([z.string(), z.null()]),
      crag_id: z.union([z.number(), z.null()]),
      description: z.union([z.string(), z.null()]),
      latitude: z.union([z.number(), z.null()]),
      location_name: z.union([z.string(), z.null()]),
      longitude: z.union([z.number(), z.null()]),
      name: z.string(),
      path: z.string(),
      searchable_id: z.number(),
      searchable_type: z.string(),
    }),
  ),
})

export default {
  query: async (query, blockId, cragName, sectorName) => {
    const cacheKey = `27crags-${blockId}-${generateSlug(query)}`

    const cragSlug = cragName != null ? generateSlug(cragName) : null
    const sectorSlug = sectorName != null ? generateSlug(sectorName) : null
    const querySlug = generateSlug(query)

    try {
      if (await keyv.has(cacheKey)) {
        return keyv.get(cacheKey)
      }

      const response = await fetch(`https://27crags.com/api/web01/search?query=${query}`)
      const data = await response.json()

      const parsed = QueryResponse27crags.parse(data)
      const item = parsed.search_keys.find(
        (item) =>
          generateSlug(item.name) === querySlug &&
          item.searchable_type === 'Route' &&
          ((cragSlug != null && item.description?.toLowerCase().includes(cragSlug.toLowerCase())) ||
            (sectorSlug != null && item.description?.toLowerCase().includes(sectorSlug.toLowerCase()))),
      )

      if (item != null) {
        const data: RouteExternalResource27crags = {
          ...item,
          externalResourcesFk: -1,
          id: -1,
          url: `https://27crags.com/${item.path}`,
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
    const grade = data.description
      ?.split(',')[0]
      .match(/\(.+\)/)
      ?.at(0)
      ?.replace('(', '')
      .replace(')', '')

    const route: Route = {
      blockFk: -1,
      createdAt: '',
      createdBy: -1,
      description: null,
      externalResourcesFk: null,
      firstAscentFk: null,
      grade: grade ?? null,
      gradingScale: grade?.startsWith('V') ? 'V' : 'FB',
      id: data.searchable_id ?? -1,
      name: data.name ?? '',
      rating: null,
      slug: data.path ?? '',
    }

    return route
  },

  checkSession: async (_, userExternalResource) => {
    if (userExternalResource.cookie27crags == null) {
      return null
    }

    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: '27crags.com',
        path: '/login',
        method: 'GET',
        headers: {
          Cookie: `_27crags_session=${userExternalResource.cookie27crags}`,
        },
      }

      const req = http.request(options, (res) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let responseData = ''
        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', async () => {
          if (res.statusCode === 302) {
            const cookies = res.headers['set-cookie'] ?? []
            const cookiesObj = parse(cookies.join('; '))

            if (typeof cookiesObj.js_user === 'string') {
              resolve({ userName: cookiesObj.js_user })
            } else {
              reject(new Error('Your 27crags session is invalid'))
            }
          } else {
            console.log('Failed checkSession POST https://27crags.com/login')
            reject(new Error(`Failed 27crags session check: ${res.statusCode} ${res.statusMessage}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.end()
    })
  },

  logAscent: async (ascent, externalResourceId, userExternalResource, session) => {
    const externalResource =
      externalResourceId == null
        ? null
        : await db.query.routeExternalResource27crags.findFirst({
            where: eq(routeExternalResource27crags.id, externalResourceId),
          })

    if (externalResource == null || userExternalResource.cookie27crags == null) {
      return
    }

    const formData = new FormData()
    formData.append('ascent[route_id]', String(externalResource.searchable_id))
    formData.append('ascent[date]', ascent.dateTime)
    formData.append('ascent[details]', ascent.notes ?? '')
    formData.append('ascent[ascent_type]', ascent.type === 'flash' ? ascent.type : 'redpoint')

    const url = `https://27crags.com/climbers/${session.userName}/ascents`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `_27crags_session=${userExternalResource.cookie27crags}`,
      },
      body: formData,
      redirect: 'manual',
    })

    if (res.status !== 302) {
      const json = await res.text()

      console.log(`Failed logAscent POST ${url}`)
      console.log(json)
      throw new Error(`Unable to log 27crags ascent: ${res.status} ${res.statusText}`)
    }
  },
} as ExternalResourceHandler<RouteExternalResource27crags, { userName: string }>
