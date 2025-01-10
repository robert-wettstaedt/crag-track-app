import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import { buildNestedAreaQuery } from '$lib/db/utils'
import { error, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export const load = async ({ locals, params }) => {
  const db = await createDrizzleSupabaseClient(locals.supabase)

  const block = await db((tx) =>
    tx.query.blocks.findFirst({
      where: eq(schema.blocks.id, Number(params.id)),
      with: {
        area: buildNestedAreaQuery(),
      },
    }),
  )

  const path = []
  let parent = block?.area
  while (parent != null) {
    path.unshift(`${parent.slug}-${parent.id}`)
    parent = parent.parent
  }

  if (block == null || path.length === 0) {
    error(404, 'Not found')
  }

  const mergedPath = ['areas', ...path, '_', 'blocks', block?.slug].join('/')

  redirect(301, '/' + mergedPath)
}
