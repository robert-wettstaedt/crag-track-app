import { db } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import { eq } from 'drizzle-orm'

export const migrate = async () => {
  const allAreas = await db.query.areas.findMany({
    with: {
      parent: true,
      blocks: {
        with: {
          files: true,
        },
      },
    },
  })

  const areas = allAreas.filter((area) => area.blocks.some((block) => block.order == null))

  await Promise.all(
    areas.map(async (area) => {
      const sortedBlocks = area.blocks.some((block) => block.name.match(/\d+/) == null)
        ? area.blocks
        : area.blocks.toSorted((a, b) => {
            const aNum = Number(a.name.match(/\d+/)?.at(0) ?? 0)
            const bNum = Number(b.name.match(/\d+/)?.at(0) ?? 0)

            return aNum - bNum
          })

      await Promise.all(
        sortedBlocks.map(async (block, index) => {
          await db.update(schema.blocks).set({ order: index }).where(eq(schema.blocks.id, block.id))
        }),
      )
    }),
  )
}
