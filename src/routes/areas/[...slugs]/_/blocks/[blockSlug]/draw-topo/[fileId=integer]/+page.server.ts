import { convertException } from '$lib'
import { db } from '$lib/db/db.server.js'
import { blocks, files } from '$lib/db/schema'
import { validateBlockForm, type BlockActionFailure, type BlockActionValues, validateTopoForm } from '$lib/forms.server'
import { searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
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
    with: {
      files: {
        where: eq(files.id, Number(params.fileId)),
      },
    },
  })
  const block = blocksResult.at(0)

  if (block == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const file = block.files.at(0)

  if (file == null) {
    error(404)
  }

  try {
    const stat = await searchNextcloudFile(session, file)

    if (!stat.mime?.includes('image')) {
      throw 'Can only draw topos on image files'
    }

    return {
      block,
      file: {
        ...file,
        stat,
      },
    }
  } catch (exception) {
    error(401, convertException(exception))
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    const data = await request.formData()

    try {
      await validateTopoForm(data)
    } catch (exception) {
      return exception
    }

    return fail(500, { error: 'Not implemented' })
    // const { areaId } = convertAreaSlug(params)

    // const session = await locals.auth()
    // if (session?.user == null) {
    //   error(401)
    // }

    // let values: BlockActionValues

    // try {
    //   values = await validateBlockForm(data)
    // } catch (exception) {
    //   return exception as BlockActionFailure
    // }

    // try {
    //   await db
    //     .update(blocks)
    //     .set(values)
    //     .where(and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)))
    // } catch (exception) {
    //   return fail(404, { ...values, error: convertException(exception) })
    // }

    // redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
  },
}
