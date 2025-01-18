import { EDIT_PERMISSION } from '$lib/auth'
import { handleFileUpload } from '$lib/components/FileUpload/handle.server'
import { config } from '$lib/config'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, areas, blocks, generateSlug, topos, users, type Block } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { blockActionSchema, validateFormData, type ActionFailure, type BlockActionValues } from '$lib/forms.server'
import { convertAreaSlug, getUser } from '$lib/helper.server'
import { createGeolocationFromFiles } from '$lib/topo-files.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, count, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, parent }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const db = await createDrizzleSupabaseClient(locals.supabase)

  // Retrieve the areaId from the parent function
  const { areaId } = await parent()

  // Query the database to find the area with the given areaId
  const areaResult = await db((tx) => tx.query.areas.findFirst({ where: eq(areas.id, areaId) }))

  // If the area is not found, throw a 404 error
  if (areaResult == null) {
    error(404)
  }

  const [blocksCount] = await db((tx) => tx.select({ count: count() }).from(blocks).where(eq(blocks.areaFk, areaId)))

  // Return the area result
  return {
    area: areaResult,
    blocksCount: Number(blocksCount.count),
  }
}) satisfies PageServerLoad

export const actions = {
  default: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

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

    // Generate a slug from the block name
    const slug = generateSlug(values.name)

    // Convert the area slug from the parameters
    const { areaId, areaSlug, path } = convertAreaSlug(params)

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
        error: `Block with name "${existingBlocksResult.name}" already exists in area "${areaSlug}"`,
      })
    }

    const [blocksCount] = await db((tx) => tx.select({ count: count() }).from(blocks).where(eq(blocks.areaFk, areaId)))

    let block: Block | undefined

    try {
      // Find the user in the database using their email
      const user = await db((tx) => tx.query.users.findFirst({ where: eq(users.authUserFk, locals.user!.id) }))
      if (user == null) {
        // If the user is not found, throw an error
        throw new Error('User not found')
      }

      // Insert the new block into the database
      const blockResult = await db((tx) =>
        tx
          .insert(blocks)
          .values({ ...values, createdBy: user.id, areaFk: areaId, order: blocksCount.count, slug })
          .returning(),
      )
      block = blockResult.at(0)

      await db(async (tx) =>
        user == null || block == null
          ? null
          : tx.insert(activities).values({
              type: 'created',
              userFk: user.id,
              entityId: block.id,
              entityType: 'block',
              parentEntityId: areaId,
              parentEntityType: 'area',
            }),
      )
    } catch (exception) {
      // If insertion fails, return a 400 error with the exception message
      return fail(400, { ...values, error: convertException(exception) })
    }

    if (values.folderName != null && block != null) {
      try {
        const results = await db((tx) =>
          handleFileUpload(tx, locals.supabase, values.folderName!, config.files.folders.topos, { blockFk: block.id }),
        )

        const fileBuffers = results.map((result) => result.fileBuffer)

        await db(async (tx) => (block == null ? null : createGeolocationFromFiles(tx, block, fileBuffers)))
        await db((tx) =>
          Promise.all(results.map((result) => tx.insert(topos).values({ blockFk: block.id, fileFk: result.file.id }))),
        )
      } catch (exception) {
        return fail(400, {
          error: `The block was successfully created but an error occurred while creating topos: ${convertException(exception)}`,
        })
      }
    }

    // Redirect to the newly created block's page
    const mergedPath = ['areas', ...path, '_', 'blocks', slug].join('/')
    redirect(303, '/' + mergedPath)
  },
}
