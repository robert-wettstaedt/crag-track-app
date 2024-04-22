import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { areas, generateSlug, users, type Area } from '$lib/db/schema'
import { validateAreaForm, type AreaActionFailure, type AreaActionValues } from '$lib/forms.server.js'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId, canAddArea } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const parentAreaResult = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })

  if (!canAddArea) {
    error(400, 'Max depth reached')
  }

  return {
    parent: parentAreaResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: AreaActionValues

    try {
      values = await validateAreaForm(data)
    } catch (exception) {
      return exception as AreaActionFailure
    }

    const slug = generateSlug(values.name)

    let parentArea: Area | undefined
    let path: string[]
    try {
      const { areaId, path: areaPath } = convertAreaSlug(params)
      parentArea = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })
      path = areaPath
    } catch (error) {
      parentArea = undefined
      path = []
    }

    const existingAreasResult = await db.query.areas.findMany({ where: eq(areas.slug, slug) })
    if (existingAreasResult.length > 0) {
      return fail(400, { ...values, error: `Area with name "${existingAreasResult[0].name}" already exists` })
    }

    let createdArea: Area
    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      createdArea = (
        await db
          .insert(areas)
          .values({ ...values, createdBy: user.id, parentFk: parentArea?.id, slug })
          .returning()
      )[0]
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, `${slug}-${createdArea?.id}`].join('/')
    redirect(303, '/' + mergedPath)
  },
}
