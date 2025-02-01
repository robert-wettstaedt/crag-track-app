import { EDIT_PERMISSION } from '$lib/auth'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { blocks } from '$lib/db/schema'
import { error } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'

export const PUT = async ({ locals, params, url }) => {
  if (!locals.userPermissions?.includes(EDIT_PERMISSION)) {
    error(404)
  }

  const { areaId } = params
  const ids = url.searchParams.getAll('id')

  const rls = await createDrizzleSupabaseClient(locals.supabase)

  return await rls(async (db) => {
    await Promise.all(
      ids.map((id, index) =>
        db
          .update(blocks)
          .set({ order: index })
          .where(and(eq(blocks.areaFk, Number(areaId)), eq(blocks.id, Number(id)))),
      ),
    )

    const updatedBlocks = await db.query.blocks.findMany({
      orderBy: [blocks.order, blocks.name],
      where: eq(blocks.areaFk, Number(areaId)),
    })

    return new Response(JSON.stringify({ blocks: updatedBlocks }))
  })
}
