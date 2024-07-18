import { db } from '$lib/db/db.server.js'
import { ascents, blocks, files, routes, topoRoutes, topos } from '$lib/db/schema'
import { enrichTopo } from '$lib/db/utils'
import {
  validateAddTopoForm,
  validateSaveTopoForm,
  type AddTopoActionFailure,
  type AddTopoActionValues,
  type SaveTopoActionValues,
} from '$lib/forms.server'
import { error, fail, redirect } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ locals, params, parent }) => {
  const { areaId, areaSlug, user } = await parent()

  const session = await locals.auth()
  if (session?.user == null) {
    error(401)
  }

  const blocksResult = await db.query.blocks.findMany({
    where: and(eq(blocks.slug, params.blockSlug), eq(blocks.areaFk, areaId)),
    with: {
      routes: {
        orderBy: routes.grade,
        with: {
          ascents: user == null ? { limit: 0 } : { where: eq(ascents.createdBy, user.id) },
        },
      },
      topos: {
        with: {
          file: true,
          routes: true,
        },
      },
    },
  })
  const block = blocksResult.at(0)

  if (block?.topos == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const topos = await Promise.all(block.topos.map((topo) => enrichTopo(topo, session)))

  const enrichedRoutes = block.routes.map((route) => {
    return {
      ...route,
      hasTopo: topos.flatMap((topo) => topo.routes).some((topoRoute) => topoRoute.routeFk === route.id),
    }
  })

  return {
    block: { ...block, routes: enrichedRoutes },
    topos,
  }
}) satisfies PageServerLoad

export const actions = {
  saveRoute: async ({ request }) => {
    const data = await request.formData()

    let values: SaveTopoActionValues

    try {
      values = await validateSaveTopoForm(data)
    } catch (exception) {
      return exception
    }

    await db
      .update(topoRoutes)
      .set({
        path: values.path,
        routeFk: Number(values.routeFk),
        topoFk: Number(values.topoFk),
        topType: values.topType,
      })
      .where(eq(topoRoutes.id, Number(values.id)))
  },

  addRoute: async ({ request }) => {
    // Get form data from the request
    const data = await request.formData()
    let values: AddTopoActionValues

    // Validate the ascent form data
    try {
      values = await validateAddTopoForm(data)
    } catch (exception) {
      return exception as AddTopoActionFailure
    }

    await db
      .insert(topoRoutes)
      .values({ topType: 'top', routeFk: Number(values.routeFk), topoFk: Number(values.topoFk) })
  },

  removeTopo: async ({ params, request }) => {
    const data = await request.formData()
    const id = Number(data.get('id'))

    const topo = await db.query.topos.findFirst({ where: eq(topos.id, id) })

    if (topo == null) {
      return fail(404, { error: `Topo with id ${id} not found` })
    }

    await Promise.all([
      topo.fileFk == null ? null : db.delete(files).where(eq(files.id, topo.fileFk)),
      db.delete(topoRoutes).where(eq(topoRoutes.topoFk, id)),
      db.delete(topos).where(eq(topos.id, id)),
    ])

    if (topo.blockFk != null) {
      const remainingTopos = await db.query.topos.findMany({ where: eq(topos.blockFk, topo.blockFk) })
      if (remainingTopos.length === 0) {
        redirect(303, `/areas/${params.slugs}/_/blocks/${params.blockSlug}`)
      }
    }
  },
}
