import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { ascents, boulders, crags, files, users, type Ascent, type File } from '$lib/db/schema'
import { validateAscentForm, type AscentActionFailure, type AscentActionValues } from '$lib/forms.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { FileStat } from 'webdav'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params }) => {
  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const crag = await db.query.crags.findFirst({
    where: eq(crags.slug, params.cragSlug),
    with: {
      boulders: {
        where: eq(boulders.slug, params.boulderSlug),
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

  return {
    boulder,
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const session = await locals.auth()
    if (session?.user?.email == null) {
      error(401)
    }

    const data = await request.formData()
    let values: AscentActionValues

    try {
      values = await validateAscentForm(data)
    } catch (exception) {
      return exception as AscentActionFailure
    }

    const crag = await db.query.crags.findFirst({
      where: eq(crags.slug, params.cragSlug),
      with: {
        boulders: {
          where: eq(boulders.slug, params.boulderSlug),
        },
      },
    })

    const boulder = crag?.boulders?.at(0)

    if (boulder == null) {
      return fail(400, { ...values, error: `Unable to find boulder ${params.boulderSlug}` })
    }

    if (crag != null && crag.boulders.length > 1) {
      return fail(400, { ...values, error: `Multiple boulders with slug ${params.boulderSlug} found` })
    }

    let stat: FileStat | undefined = undefined

    if (values.filePath !== `/${session.user?.email}/`) {
      try {
        stat = (await getNextcloud(session)?.stat(values.filePath)) as FileStat | undefined
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
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
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      const results = await db
        .insert(ascents)
        .values({ ...values, boulderFk: boulder.id, createdBy: user.id })
        .returning()
      ascent = results[0]
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
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
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    const mergedPath = ['areas', params.slugs, '_', 'crags', params.cragSlug, 'boulders', params.boulderSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
