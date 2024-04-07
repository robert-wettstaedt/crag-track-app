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

  const ascent = await db.query.ascents.findFirst({
    where: eq(ascents.id, Number(params.ascentId)),
    with: {
      author: true,
      files: true,
    },
  })

  if (ascent == null) {
    error(404)
  }

  if (session.user.email !== ascent.author.email) {
    error(401)
  }

  return {
    ascent,
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
      return fail(404, { ...values, error: `Boulder not found ${params.boulderSlug}` })
    }

    if (crag != null && crag.boulders.length > 1) {
      return fail(400, { ...values, error: `Multiple boulders with slug ${params.boulderSlug} found` })
    }

    let hasFiles = false
    if (values.filePaths != null) {
      try {
        await Promise.all(
          values.filePaths
            .filter((filePath) => filePath.trim().length > 0)
            .map(async (filePath) => {
              hasFiles = true
              const stat = (await getNextcloud(session)?.stat(session.user!.email + filePath)) as FileStat | undefined

              if (stat == null) {
                throw `Unable to read file: "${filePath}"`
              }

              if (stat.type === 'directory') {
                throw `path must be a file not a directory: "${filePath}"`
              }
            }),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    let ascent: Ascent
    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, session.user.email) })
      if (user == null) {
        throw new Error('User not found')
      }

      const results = await db
        .update(ascents)
        .set({ ...values, boulderFk: boulder.id, createdBy: user.id })
        .where(eq(ascents.id, Number(params.ascentId)))
        .returning()
      ascent = results[0]
    } catch (exception) {
      return fail(400, { ...values, error: convertException(exception) })
    }

    if (hasFiles) {
      try {
        const fileType: File['type'] = values.type === 'flash' ? 'send' : values.type

        await db.delete(files).where(eq(files.ascentFk, ascent.id))

        await db.insert(files).values(
          values
            .filePaths!.filter((filePath) => filePath.trim().length > 0)
            .map((filePath) => ({
              ascentFk: ascent.id,
              path: filePath,
              type: fileType,
            })),
        )
      } catch (exception) {
        return fail(400, { ...values, error: convertException(exception) })
      }
    }

    const mergedPath = ['areas', params.slugs, '_', 'crags', params.cragSlug, 'boulders', params.boulderSlug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
