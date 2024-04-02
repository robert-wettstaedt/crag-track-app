import { db } from '$lib/db/db.server.js'
import { ascents, boulders, files, type Ascent, type Boulder, type File } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ params }) => {
  const bouldersResult = await db.query.boulders.findMany({ where: eq(boulders.slug, params.boulderSlug) })
  const boulder = bouldersResult.at(0)

  if (boulder == null) {
    error(404)
  }

  if (bouldersResult.length > 1) {
    error(400, `Multiple boulders with slug ${params.boulderSlug} found`)
  }

  return {
    boulder,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (error) {
      return error as AscentActionFailure
    }

    const parentsResult = await db.select().from(boulders).where(eq(boulders.slug, params.boulderSlug))
    const parent = parentsResult.at(0)

    if (parent == null) {
      return fail(400, { ...values, error: `Unable to find boulder ${params.boulderSlug}` })
    }

    let stat: FileStat | undefined = undefined
    let boulder: Boulder | undefined = undefined

    if (values.filePath !== `/${session?.user?.email}/`) {
      const bouldersResult = await db.query.boulders.findMany({
        where: eq(boulders.slug, params.boulderSlug),
        with: {
          files: true,
        },
      })
      boulder = bouldersResult.at(0)

      if (boulder == null) {
        return fail(404, values)
      }

      if (bouldersResult.length > 1) {
        return fail(400, { error: `Multiple boulders with slug ${params.boulderSlug} found` })
      }

      try {
        stat = (await getNextcloud(session)?.stat(values.filePath)) as FileStat | undefined
      } catch (error) {
        if (error instanceof Error) {
          return fail(400, { ...values, error: error.message })
        }

        return fail(400, { ...values, error: String(error) })
      }

      if (stat == null) {
        return fail(400, { ...values, error: 'Unable to read file' })
      }

      if (stat.type === 'directory') {
        return fail(400, { ...values, error: 'path must be a file not a directory' })
      }
    }

    let ascent: Ascent
    try {
      const results = await db
        .insert(ascents)
        .values({ ...values, boulder: parent.id, createdBy: 1 })
        .returning()
      ascent = results[0]
    } catch (error) {
      if (error instanceof Error) {
        return fail(400, { ...values, error: error.message })
      }

      return fail(400, { ...values, error: JSON.stringify(error) })
    }

    if (stat != null && boulder != null) {
      try {
        const fileType: File['type'] = values.type === 'flash' ? 'send' : values.type

        await db.insert(files).values({
          ascentFk: ascent.id,
          boulderFk: boulder.id,
          mime: stat.mime,
          path: values.filePath,
          type: fileType,
        })
      } catch (error) {
        if (error instanceof Error) {
          return fail(400, { ...values, error: error.message })
        }

        return fail(400, { ...values, error: JSON.stringify(error) })
      }
    }

    const mergedPath = ['areas', params.slugs, '_', 'crags', params.cragSlug, 'boulders', params.boulderSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
