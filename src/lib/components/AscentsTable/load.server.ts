import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, routes, users, type Ascent } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichAscent, type EnrichedAscent } from '$lib/db/utils'
import { validateObject } from '$lib/forms.server'
import { getPaginationQuery, paginationParamsSchema, type PaginatedData } from '$lib/pagination.server'
import type { RequestEvent } from '@sveltejs/kit'
import { and, asc, count, desc, eq, inArray, SQL } from 'drizzle-orm'
import { z } from 'zod'

export type PaginatedAscents = PaginatedData<{ ascents: EnrichedAscent[] }>

const searchParamsSchema = z.intersection(
  z.object({
    orderBy: z.string().default('dateTime'),
    grade: z.number().optional(),
  }),
  paginationParamsSchema,
)

export const load = async ({ locals, params, url }: RequestEvent): Promise<PaginatedAscents> => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const searchParamsObj = Object.fromEntries(url.searchParams.entries())
  const searchParams = await validateObject(searchParamsSchema, searchParamsObj)

  const routesOfGrade = (
    await db(async (tx) =>
      searchParams.grade == null
        ? null
        : tx.query.routes.findMany({
            where: eq(routes.gradeFk, searchParams.grade),
            columns: { id: true },
          }),
    )
  )?.map(({ id }) => id)

  const user = await db(async (tx) =>
    params.name == null ? undefined : tx.query.users.findFirst({ where: eq(users.username, params.name) }),
  )

  const whereArr = [
    routesOfGrade == null ? undefined : inArray(ascents.routeFk, routesOfGrade),
    user == null ? undefined : eq(ascents.createdBy, user.id),
  ].filter(Boolean) as SQL<unknown>[]

  const where = whereArr.length === 1 ? whereArr[0] : whereArr.length === 2 ? and(whereArr[0], whereArr[1]) : undefined

  // Query the database for ascents, ordering by the specified field, with pagination
  const ascentsResults = await db((tx) =>
    tx.query.ascents.findMany({
      ...getPaginationQuery(searchParams),
      orderBy: [desc(ascents[searchParams.orderBy as keyof Ascent]), asc(ascents.id)],
      where,
      with: {
        author: true,
        route: {
          with: {
            block: {
              with: {
                area: buildNestedAreaQuery(),
              },
            },
          },
        },
      },
    }),
  )

  // Query the database to get the total count of ascents
  const countResults = await db((tx) => tx.select({ count: count() }).from(ascents).where(where))
  // Enrich each ascent result with additional route information
  const enrichedAscents = ascentsResults.map(enrichAscent)

  // Return the enriched ascents and pagination information
  return {
    ascents: enrichedAscents,
    pagination: {
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      total: countResults[0].count,
      totalPages: Math.ceil(countResults[0].count / searchParams.pageSize),
    },
  }
}
