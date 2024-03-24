import { db } from '$lib/db/db.server.js'
import { areas } from '$lib/db/schema'
import { validateCragForm, type CragActionFailure, type CragActionValues } from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const path = params.slugs.split('/')
  const slug = path.at(-1)

  if (slug == null) {
    error(404)
  }

  const areasResult = await db.query.areas.findMany({ where: eq(areas.slug, slug) })
  const area = areasResult.at(0)

  if (area == null) {
    error(404)
  }

  if (areasResult.length > 1) {
    error(400, `Multiple areas with slug ${slug} found`)
  }

  return {
    name: area.name,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ params, request }) => {
    const data = await request.formData()
    let values: CragActionValues

    try {
      values = await validateCragForm(data)
    } catch (error) {
      return error as CragActionFailure
    }

    const path = params.slugs.split('/')
    const slug = path.at(-1)

    if (slug == null) {
      return fail(404, { ...values, error: 'Area not found' })
    }

    try {
      await db.update(areas).set(values).where(eq(areas.slug, slug))
    } catch (error) {
      if (error instanceof Error) {
        fail(404, { ...values, error: error.message })
      }

      fail(404, { ...values, error: String(error) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
