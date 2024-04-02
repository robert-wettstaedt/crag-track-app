import { db } from '$lib/db/db.server.js'
import { areas, crags, generateSlug, users } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server.js'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const path = params.slugs.split('/')
  const parentSlug = path.at(-1)
  const parentsResult = parentSlug == null ? [] : await db.query.areas.findMany({ where: eq(areas.slug, parentSlug) })

  const parent = parentsResult.at(0)

  if (parent == null) {
    error(404)
  }

  if (parentsResult.length > 1) {
    error(400, `Multiple areas with slug ${parentSlug} found`)
  }

  return {
    parent,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (error) {
      return error as CragActionFailure
    }

    const slug = generateSlug(values.name)

    const path = params.slugs.split('/')
    const parentSlug = path.at(-1)
    const parentsResult =
      parentSlug == null
        ? []
        : await db.select({ id: areas.id, name: areas.name }).from(areas).where(eq(areas.slug, parentSlug))
    const parent = parentsResult.at(0)

    if (parent == null) {
      return fail(400, { ...values, error: `Unable to find parent ${parentSlug}` })
    }

    const existingCragsResult = await db
      .select()
      .from(crags)
      .where(and(eq(crags.slug, slug), eq(crags.parent, parent.id)))

    if (existingCragsResult.length > 0) {
      return fail(400, {
        ...values,
        error: `Crag with name "${existingCragsResult[0].name}" already exists in area "${parent.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(crags).values({ ...values, createdBy: user.id, parent: parent.id, slug })
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: JSON.stringify(error) })
    }

    const mergedPath = ['areas', ...path, '_', 'crags', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
