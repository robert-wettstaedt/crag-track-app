import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { activities, ascents, blocks, files, routes, topoRoutes, topos } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import { convertException } from '$lib/errors'
import {
  addTopoActionSchema,
  saveTopoActionSchema,
  validateFormData,
  type ActionFailure,
  type AddTopoActionValues,
  type SaveTopoActionValues,
} from '$lib/forms.server'
import { convertAreaSlug, getUser } from '$lib/helper.server'
import { load as loadServerLayout } from '$lib/layout/layout.server'
import { deleteFile } from '$lib/nextcloud/nextcloud.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async (event) => {
  const layoutData = await loadServerLayout(event)

  const { locals, params } = event

  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const localDb = await createDrizzleSupabaseClient(locals.supabase)

  const { areaId, areaSlug } = convertAreaSlug(params)

  const blocksResult = await localDb((tx) =>
    tx.query.blocks.findMany({
      where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      with: {
        routes: {
          orderBy: routes.gradeFk,
          with: {
            ascents: layoutData.user == null ? { limit: 0 } : { where: eq(ascents.createdBy, layoutData.user.id) },
          },
        },
        topos: {
          with: {
            file: true,
            routes: true,
          },
        },
      },
    }),
  )
  const block = blocksResult.at(0)

  if (block?.topos == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo)))

  const enrichedRoutes = block.routes.map((route) => {
    return {
      ...route,
      hasTopo: topos.flatMap((topo) => topo.routes).some((topoRoute) => topoRoute.routeFk === route.id),
    }
  })

  return {
    ...layoutData,
    block: { ...block, routes: enrichedRoutes },
    topos,
  }
}) satisfies PageServerLoad

export const actions = {
  saveRoute: async ({ locals, request, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    const { areaId } = convertAreaSlug(params)

    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      }),
    )

    const data = await request.formData()

    let values: SaveTopoActionValues

    try {
      values = await validateFormData(saveTopoActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<SaveTopoActionValues>
    }

    await db((tx) =>
      tx
        .update(topoRoutes)
        .set({
          path: values.path,
          routeFk: Number(values.routeFk),
          topoFk: Number(values.topoFk),
          topType: values.topType,
        })
        .where(eq(topoRoutes.id, Number(values.id))),
    )

    await db(async (tx) =>
      user == null
        ? null
        : tx.insert(activities).values({
            type: 'updated',
            userFk: user.id,
            entityId: values.routeFk,
            entityType: 'route',
            columnName: 'topo',
            parentEntityId: block?.id,
            parentEntityType: 'block',
          }),
    )

    return values.routeFk
  },

  addRoute: async ({ locals, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Get form data from the request
    const data = await request.formData()
    let values: AddTopoActionValues

    // Validate the ascent form data
    try {
      values = await validateFormData(addTopoActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AddTopoActionValues>
    }

    await db((tx) =>
      tx
        .insert(topoRoutes)
        .values({ topType: 'topout', routeFk: Number(values.routeFk), topoFk: Number(values.topoFk) }),
    )
  },

  removeRoute: async ({ locals, request, params }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    const { areaId } = convertAreaSlug(params)

    const block = await db((tx) =>
      tx.query.blocks.findFirst({
        where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
      }),
    )

    // Get form data from the request
    const data = await request.formData()
    let values: AddTopoActionValues

    // Validate the ascent form data
    try {
      values = await validateFormData(addTopoActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AddTopoActionValues>
    }

    await db((tx) =>
      tx
        .delete(topoRoutes)
        .where(and(eq(topoRoutes.routeFk, Number(values.routeFk)), eq(topoRoutes.topoFk, Number(values.topoFk)))),
    )

    await db(async (tx) =>
      user == null
        ? null
        : tx.insert(activities).values({
            type: 'deleted',
            userFk: user.id,
            entityId: values.routeFk,
            entityType: 'route',
            columnName: 'topo',
            parentEntityId: block?.id,
            parentEntityType: 'block',
          }),
    )
  },

  removeTopo: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)
    const user = await db((tx) => getUser(locals.user, tx))

    const { areaId } = convertAreaSlug(params)

    const data = await request.formData()
    const id = Number(data.get('id'))

    const topo = await db((tx) => tx.query.topos.findFirst({ where: eq(topos.id, id), with: { file: true } }))

    if (topo == null) {
      return fail(404, { error: `Topo with id ${id} not found` })
    }

    try {
      const filesToDelete = await db(async (tx) =>
        topo.fileFk == null ? null : tx.delete(files).where(eq(files.id, topo.fileFk)).returning(),
      )

      await db((tx) =>
        Promise.all([
          ...(filesToDelete ?? []).map((file) => deleteFile(file)),
          tx.delete(topoRoutes).where(eq(topoRoutes.topoFk, id)),
          tx.delete(topos).where(eq(topos.id, id)),
        ]),
      )

      await db(async (tx) =>
        user == null || topo.blockFk == null
          ? null
          : tx.insert(activities).values({
              type: 'deleted',
              userFk: user.id,
              entityId: topo.blockFk,
              entityType: 'block',
              columnName: 'topo image',
              parentEntityId: areaId,
              parentEntityType: 'area',
            }),
      )
    } catch (exception) {
      return fail(400, { error: convertException(exception) })
    }

    if (topo.blockFk != null) {
      const remainingTopos = await db((tx) => tx.query.topos.findMany({ where: eq(topos.blockFk, topo.blockFk!) }))
      if (remainingTopos.length === 0) {
        redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
      }
    }
  },
}
