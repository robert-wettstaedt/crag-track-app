import { db } from '$lib/db/db.server.js'
import * as schema from '$lib/db/schema'
import { buildNestedAreaQuery } from '$lib/db/utils.js'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export const load = async ({ params }) => {
  const route = await db.query.routes.findFirst({
    where: eq(schema.routes.id, Number(params.id)),
    with: {
      block: {
        with: {
          area: buildNestedAreaQuery(),
        },
      },
    },
  })

  const path = []
  let parent = route?.block?.area
  while (parent != null) {
    path.unshift(`${parent.slug}-${parent.id}`)
    parent = parent.parent
  }

  if (route == null || path.length === 0) {
    error(404, 'Not found')
  }

  const mergedPath = [
    'areas',
    ...path,
    '_',
    'blocks',
    route.block?.slug,
    'routes',
    route.slug.length === 0 ? route.id : route.slug,
  ].join('/')

  redirect(301, '/' + mergedPath)
}
