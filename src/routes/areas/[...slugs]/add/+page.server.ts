import { db } from '$lib/db/db.server.js'
import { areas, generateSlug } from '$lib/db/schema'
import { validateAreaForm, type AreaActionFailure, type AreaActionValues } from '$lib/forms.server.js'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const path = params.slugs.split('/')
  const parentSlug = path.at(-1)
  const parentsResult = parentSlug == null ? [] : await db.query.areas.findMany({ where: eq(areas.slug, parentSlug) })
  const parent = parentsResult.at(0)

  if (parentsResult.length > 1) {
    error(400, `Multiple areas with slug ${parentSlug} found`)
  }

  return {
    parent,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: AreaActionValues

    try {
      values = await validateAreaForm(data)
    } catch (error) {
      return error as AreaActionFailure
    }

    const slug = generateSlug(values.name)

    const path = params.slugs.split('/')
    const parentSlug = path.at(-1)
    const parentsResult =
      parentSlug == null ? [] : await db.select({ id: areas.id }).from(areas).where(eq(areas.slug, parentSlug))
    const parent = parentsResult.at(0)

    const existingAreasResult = await db.select().from(areas).where(eq(areas.slug, slug))
    if (existingAreasResult.length > 0) {
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    try {
      await db.insert(areas).values({ ...values, createdBy: 1, parent: parent?.id, slug })
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: JSON.stringify(error) })
    }

    const mergedPath = ['areas', ...path, slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
