import { db } from '$lib/db/db.server.js'
import * as schema from '$lib/db/schema'
import { buildNestedAreaQuery } from '$lib/db/utils.js'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export const load = async ({ params }) => {
  const area = await db.query.areas.findFirst({
    where: eq(schema.areas.id, Number(params.id)),
    with: {
      parent: buildNestedAreaQuery(),
    },
  })

  const path = []
  let parent = area
  while (parent != null) {
    path.unshift(`${parent.slug}-${parent.id}`)
    parent = parent.parent
  }

  if (area == null || path.length === 0) {
    error(404, 'Not found')
  }

  const mergedPath = ['areas', ...path].join('/')

  redirect(301, '/' + mergedPath)
}
