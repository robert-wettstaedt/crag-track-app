import { db } from '$lib/db/db.server.js'
import { blocks, topoRoutes } from '$lib/db/schema'
import {
  validateAddTopoForm,
  validateSaveTopoForm,
  type AddTopoActionFailure,
  type AddTopoActionValues,
  type SaveTopoActionValues,
} from '$lib/forms.server'
import { getTopos } from '$lib/topo/topo.server'
import { error } from '@sveltejs/kit'
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
      routes: true,
    },
  })
  const block = blocksResult.at(0)

  if (block == null) {
    error(404)
  }

  if (blocksResult.length > 1) {
    error(400, `Multiple blocks with slug ${params.blockSlug} in ${areaSlug} found`)
  }

  const topos = await getTopos(block.id, session, Number(params.fileId))

  const allTopoRoutes = topos.flatMap((topo) => topo.routes)
  const routes = block.routes.map((route) => {
    return {
      ...route,
      hasTopo: allTopoRoutes.some((topoRoute) => topoRoute.routeFk === route.id),
    }
  })

  return {
    block: { ...block, routes },
    file: topos[0].file,
    topos,
  }
}) satisfies PageServerLoad

export const actions = {
  save: async ({ request }) => {
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

  add: async ({ request }) => {
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
}
