import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { routes, blocks, generateSlug, users } from '$lib/db/schema'
import { validateRouteForm, type RouteActionFailure, type RouteActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
  })
  const block = blocksResult.at(0)

  if (block == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  return {
    block,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: RouteActionValues
    const { path } = convertAreaSlug(params)

    try {
      values = await validateRouteForm(data)
    } catch (exception) {
      return exception as RouteActionFailure
    }

    const slug = generateSlug(values.name)

    const block = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    })

    if (block == null) {
      return fail(400, { ...values, error: `Parent not found ${params.blockSlug}` })
    }

    const existingRoutesResult = await db
      .select()
      .from(routes)
      .where(and(eq(routes.slug, slug), eq(routes.blockFk, block.id)))

    if (existingRoutesResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Route with name "${existingRoutesResult[0].name}" already exists in block "${block.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(routes).values({ ...values, createdBy: user.id, blockFk: block.id, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'blocks', params.blockSlug, 'routes', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
