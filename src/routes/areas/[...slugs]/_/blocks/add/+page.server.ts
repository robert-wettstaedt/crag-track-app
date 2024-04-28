import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { areas, blocks, generateSlug, users } from '$lib/db/schema'
import { validateBlockForm, type BlockActionFailure, type BlockActionValues } from '$lib/forms.server.js'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const areaResult = await db.query.areas.findFirst({ where: eq(areas.id, areaId) })

  if (areaResult == null) {
    error(404)
  }

  return {
    area: areaResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: BlockActionValues

    try {
      values = await validateBlockForm(data)
    } catch (exception) {
      return exception as BlockActionFailure
    }

    const slug = generateSlug(values.name)

    const { areaId, path } = convertAreaSlug(params)

    const existingBlocksResult = await db.query.blocks.findFirst({
      where: and(eq(blocks.slug, slug), eq(blocks.areaFk, areaId)),
    })

    if (existingBlocksResult != null) {
      return fail(400, {
        ...values,
        error: `Block with name "${existingBlocksResult.name}" already exists in area "${parent.name}"`,
      })
    }

    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      await db.insert(blocks).values({ ...values, createdBy: user.id, areaFk: areaId, slug })
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    const mergedPath = ['areas', ...path, '_', 'blocks', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
