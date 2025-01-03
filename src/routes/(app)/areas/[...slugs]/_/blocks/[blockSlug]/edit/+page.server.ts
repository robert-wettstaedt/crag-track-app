import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { blocks, files, generateSlug, geolocations, topoRoutes, topos } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { blockActionSchema, validateFormData, type ActionFailure, type BlockActionValues } from '$lib/forms.server'
import { convertAreaSlug } from '$lib/helper.server'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { getReferences } from '$lib/references.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq, inArray } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve areaId and areaSlug from the parent function
  const { areaId, areaSlug } = await parent()

  // Query the database to find blocks matching the provided slug and areaId
  const blocksResult = await db((tx) =>
    tx.query.blocks.findMany({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    }),
  )
  const block = blocksResult.at(0) // Get the first block from the result

  // If no block is found, return a 404 error
  if (block == null) {
    error(404) // Not Found error
  }

  // If multiple blocks are found, return a 400 error with a message
  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`) // Bad Request error
  }

  // Return the block name to be used in the page
  return {
    name: block.name,
  }
}) satisfies PageServerLoad

export const actions = {
  updateBlock: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert the area slug to get the areaId
    const { areaId } = convertAreaSlug(params)

    // Retrieve form data from the request
    const data = await request.formData()
    let values: BlockActionValues

    try {
      // Validate the form data
      values = await validateFormData(blockActionSchema, data)
    } catch (exception) {
      // If validation fails, return the exception as BlockActionFailure
      return exception as ActionFailure<BlockActionValues>
    }

    const slug = generateSlug(values.name)

    // Check if a block with the same slug already exists in the area
    const existingBlocksResult = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, slug), eq(blocks.areaFk, areaId)),
      }),
    )

    if (existingBlocksResult != null) {
      // If a block with the same slug exists, return a 400 error with a message
      return fail(400, {
        ...values,
        error: `Block with name "${existingBlocksResult.name}" already exists in area "${parent.name}"`,
      })
    }

    try {
      // Update the block in the database with the validated values
      const [block] = await db((tx) =>
        tx
          .update(blocks)
          .set({ ...values, slug })
          .where(and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)))
          .returning(),
      )

      const topoFiles = await db((tx) =>
        tx.query.files.findMany({ where: and(eq(files.blockFk, block.id), eq(files.type, 'topo')) }),
      )

      await Promise.all(
        topoFiles.map(async (file) => {
          const [basename, ...pathSegments] = file.path.split('/').reverse()
          const [, , ext] = basename.split('.')
          const newBasename = [slug, file.id, ext].join('.')
          const newPath = [...pathSegments.reverse(), newBasename].join('/')

          if (file.path !== newPath) {
            await getNextcloud().moveFile(NEXTCLOUD_USER_NAME + file.path, NEXTCLOUD_USER_NAME + newPath)
            await db((tx) => tx.update(files).set({ path: newPath }).where(eq(files.id, file.id)))
          }
        }),
      )
    } catch (exception) {
      // If the update fails, return a 404 error with the exception details
      return fail(404, { ...values, error: convertException(exception) })
    }

    // Redirect to the block's page after successful update
    redirect(303, `/areas/${params.slugs}/_/blocks/${slug}`)
  },

  removeBlock: async ({ locals, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Convert the area slug to get the areaId
    const { areaId, areaSlug } = convertAreaSlug(params)

    // Query the database to find blocks matching the provided slug and areaId
    const blocksResult = await db((tx) =>
      tx.query.blocks.findMany({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
        with: {
          routes: true,
        },
      }),
    )
    const block = blocksResult.at(0) // Get the first block from the result

    // If no block is found, return a 404 error
    if (block == null) {
      return fail(404, { error: `Block with slug ${params.blockSlug} in ${areaSlug} not found` }) // Not Found error
    }

    // If multiple blocks are found, return a 400 error with a message
    if (blocksResult.length > 1) {
      return fail(400, { error: `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found` }) // Bad Request error
    }

    if (block.routes.length > 0) {
      return fail(400, { error: `${block.name} has ${block.routes.length} routes. Delete routes first.` }) // Bad Request error
    }

    const references = await getReferences(block.id, 'blocks')
    if (references.areas.length + references.ascents.length + references.routes.length > 0) {
      return fail(400, { error: 'Block is referenced by other entities. Delete references first.' })
    }

    try {
      await db((tx) => tx.delete(files).where(eq(files.blockFk, block.id)))
      await db((tx) => tx.delete(geolocations).where(eq(geolocations.blockFk, block.id)))

      const deletedTopos = await db((tx) => tx.delete(topos).where(eq(topos.blockFk, block.id)).returning())

      if (deletedTopos.length > 0) {
        await db((tx) =>
          tx.delete(topoRoutes).where(
            inArray(
              topoRoutes.topoFk,
              deletedTopos.map((topo) => topo.id),
            ),
          ),
        )
      }

      await db((tx) => tx.delete(blocks).where(eq(blocks.id, block.id)))
    } catch (error) {
      return fail(400, { error: convertException(error) })
    }

    redirect(303, `/areas/${params.slugs}`)
  },
}
