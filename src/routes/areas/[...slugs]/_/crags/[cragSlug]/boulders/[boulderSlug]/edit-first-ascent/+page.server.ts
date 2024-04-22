import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { boulders, crags, firstAscents, users, type InsertFirstAscent } from '$lib/db/schema'
import { validateFirstAscentForm, type FirstAscentActionFailure, type FirstAscentActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/slugs.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const crag = await db.query.crags.findFirst({
    where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
    with: {
      boulders: {
        where: eq(boulders.slug, params.boulderSlug),
        with: {
          firstAscent: {
            with: {
              climber: true,
            },
          },
        },
      },
    },
  })

  const boulder = crag?.boulders?.at(0)

  if (boulder == null) {
    error(404)
  }

  if (crag != null && crag.boulders.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  const usersResult = await db.query.users.findMany()

  return {
    boulder,
    users: usersResult,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const { areaId } = convertAreaSlug(params)

    const session = await locals.auth()
    if (session?.user == null) {
      error(401)
    }

    const data = await request.formData()
    let values: FirstAscentActionValues

    try {
      values = await validateFirstAscentForm(data)
    } catch (exception) {
      return exception as FirstAscentActionFailure
    }

    const firstAscentValue: Omit<InsertFirstAscent, 'boulderFk'> = {
      climberFk: null,
      climberName: null,
      year: null,
    }

    if (values.climberName != null && values.climberName.length > 0) {
      const userResult = await db.query.users.findFirst({
        where: eq(users.userName, values.climberName),
      })

      if (userResult == null) {
        firstAscentValue.climberName = values.climberName
      } else {
        firstAscentValue.climberFk = userResult.id
      }
    }

    if (values.year != null && String(values.year).length > 0) {
      firstAscentValue.year = values.year
    }

    const crag = await db.query.crags.findFirst({
      where: and(eq(crags.slug, params.cragSlug), eq(crags.areaFk, areaId)),
      with: {
        boulders: {
          where: eq(boulders.slug, params.boulderSlug),
        },
      },
    })

    const boulder = crag?.boulders?.at(0)

    if (boulder == null) {
      return fail(404, { ...values, error: `Boulder not found ${params.boulderSlug}` })
    }

    if (crag != null && crag.boulders.length > 1) {
      return fail(400, { ...values, error: `Multiple boulders with slug ${params.boulderSlug} found` })
    }

    try {
      if (boulder.firstAscentFk == null) {
        const firstAscentResult = await db
          .insert(firstAscents)
          .values({ ...firstAscentValue, boulderFk: boulder.id })
          .returning()
        await db.update(boulders).set({ firstAscentFk: firstAscentResult[0].id }).where(eq(boulders.id, boulder.id))
      } else {
        await db.update(firstAscents).set(firstAscentValue).where(eq(firstAscents.id, boulder.firstAscentFk))
      }
    } catch (exception) {
      return fail(404, { ...values, error: convertException(exception) })
    }

    redirect(303, `/areas/${params.slugs}/_/crags/${params.cragSlug}/boulders/${params.boulderSlug}`)
  },
}
