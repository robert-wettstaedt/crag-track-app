import { db } from '$lib/db/db.server'
import { crags } from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { and, isNotNull } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async () => {
  let nestedAreaQuery: any = {
    with: {
      parentArea: true,
    },
  }
  for (let i = 0; i < 7; i++) {
    nestedAreaQuery = {
      with: {
        parentArea: nestedAreaQuery,
      },
    }
  }

  const result = await db.query.crags.findMany({
    where: and(isNotNull(crags.lat), isNotNull(crags.long)),
    ...nestedAreaQuery,
  })

  return {
    crags: result as InferResultType<'crags', { parentArea: true }>[],
  }
}) satisfies PageServerLoad
