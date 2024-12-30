import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { users } from '$lib/db/schema'
import { validateObject } from '$lib/forms.server'
import { getPaginationQuery, paginationParamsSchema } from '$lib/pagination.server'
import { asc, count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, url }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const searchParamsObj = Object.fromEntries(url.searchParams.entries())
  const searchParams = await validateObject(paginationParamsSchema, searchParamsObj)

  const usersResult = await db((tx) =>
    tx.query.users.findMany({ ...getPaginationQuery(searchParams), orderBy: asc(users.username) }),
  )

  const countResults = await db((tx) => tx.select({ count: count() }).from(users))

  return {
    users: usersResult,
    pagination: {
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      total: countResults[0].count,
    },
  }
}) satisfies PageServerLoad
