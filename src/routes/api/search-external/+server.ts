import { type InsertRoute } from '$lib/db/schema.js'
import type { InferResultType } from '$lib/db/types.js'
import {
  queryExternalResource,
  handler8a,
  handler27crags,
  handlerTheCrag,
} from '$lib/external-resources/index.server.js'
import { grades } from '$lib/grades.js'

export const GET = async ({ locals, url }) => {
  const session = await locals.auth()

  const query = url.searchParams.get('query')
  const blockId = Number(url.searchParams.get('blockId'))

  if (query == null) {
    return new Response(JSON.stringify({ error: 'Query not found' }), { status: 400 })
  }

  if (Number.isNaN(blockId)) {
    return new Response(JSON.stringify({ error: 'Block ID not found' }), { status: 400 })
  }

  const { data8a, data27crags, dataTheCrag } = await queryExternalResource(query, blockId, session)

  const route8a = data8a == null ? null : handler8a.convertToRoute(data8a)
  const route27crags = data27crags == null ? null : handler27crags.convertToRoute(data27crags)
  const routeTheCrag = dataTheCrag == null ? null : handlerTheCrag.convertToRoute(dataTheCrag)

  const gradingScale = route8a?.gradingScale ?? route27crags?.gradingScale ?? routeTheCrag?.gradingScale ?? 'FB'
  const routeGrades = [route8a?.grade, route27crags?.grade, routeTheCrag?.grade].filter(Boolean) as string[]
  const gradeIndexSum = routeGrades.reduce((sum, grade) => {
    const index = grades.findIndex((gradeObj) => gradeObj.FB === grade || gradeObj.V === grade)

    if (sum === -1) {
      return index
    }

    if (index === -1) {
      return sum
    }

    return sum + index
  }, -1)
  const gradeIndexMean = Math.round(gradeIndexSum / routeGrades.length)

  const routeRatings = [route8a?.rating, route27crags?.rating, routeTheCrag?.rating].filter(Boolean) as number[]
  const ratingSum = routeRatings.reduce((sum, rating) => sum + rating, 0)
  const ratingMean = Math.round(ratingSum / routeRatings.length)

  const route: InsertRoute = {
    blockFk: blockId,
    createdAt: '',
    createdBy: -1,
    description: route8a?.description ?? route27crags?.description ?? routeTheCrag?.description ?? null,
    externalResourcesFk: null,
    firstAscentFk: null,
    grade: gradeIndexMean < 0 ? null : grades[gradeIndexMean][gradingScale],
    gradingScale,
    name: route8a?.name ?? route27crags?.name ?? routeTheCrag?.name ?? query,
    rating: ratingMean,
    slug: '',
  }

  const routeExternalResources: InferResultType<
    'routeExternalResources',
    { externalResource8a: true; externalResource27crags: true; externalResourceTheCrag: true }
  > = {
    routeFk: -1,
    id: -1,
    externalResource27cragsFk: -1,
    externalResource8aFk: -1,
    externalResourceTheCragFk: -1,

    externalResource8a: data8a,
    externalResource27crags: data27crags,
    externalResourceTheCrag: dataTheCrag,
  }

  return new Response(JSON.stringify({ route, routeExternalResources }))
}
