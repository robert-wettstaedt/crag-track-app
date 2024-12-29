import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { ascents, blocks, files, routes, topoRoutes, topos } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import {
  addTopoActionSchema,
  saveTopoActionSchema,
  validate,
  type ActionFailure,
  type AddTopoActionValues,
  type SaveTopoActionValues,
} from '$lib/forms.server'
import { convertAreaSlug } from '$lib/helper.server'
import { load as loadServerLayout } from '$lib/layout/layout.server'
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
  saveRoute: async ({ locals, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    const data = await request.formData()

    let values: SaveTopoActionValues

    try {
      values = await validate(saveTopoActionSchema, data)
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
      values = await validate(addTopoActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AddTopoActionValues>
    }

    await db((tx) =>
      tx.insert(topoRoutes).values({ topType: 'top', routeFk: Number(values.routeFk), topoFk: Number(values.topoFk) }),
    )
  },

  removeRoute: async ({ locals, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    // Get form data from the request
    const data = await request.formData()
    let values: AddTopoActionValues

    // Validate the ascent form data
    try {
      values = await validate(addTopoActionSchema, data)
    } catch (exception) {
      return exception as ActionFailure<AddTopoActionValues>
    }

    await db((tx) =>
      tx
        .delete(topoRoutes)
        .where(and(eq(topoRoutes.routeFk, Number(values.routeFk)), eq(topoRoutes.topoFk, Number(values.topoFk)))),
    )
  },

  removeTopo: async ({ locals, params, request }) => {
    if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
      error(404)
    }

    const db = await createDrizzleSupabaseClient(locals.supabase)

    const data = await request.formData()
    const id = Number(data.get('id'))

    const topo = await db((tx) => tx.query.topos.findFirst({ where: eq(topos.id, id) }))

    if (topo == null) {
      return fail(404, { error: `Topo with id ${id} not found` })
    }

    await db((tx) =>
      Promise.all([
        topo.fileFk == null ? null : tx.delete(files).where(eq(files.id, topo.fileFk)),
        tx.delete(topoRoutes).where(eq(topoRoutes.topoFk, id)),
        tx.delete(topos).where(eq(topos.id, id)),
      ]),
    )

    if (topo.blockFk != null) {
      const remainingTopos = await db((tx) => tx.query.topos.findMany({ where: eq(topos.blockFk, topo.blockFk!) }))
      if (remainingTopos.length === 0) {
        redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
      }
    }
  },
}
