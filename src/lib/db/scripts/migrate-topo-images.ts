import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { db } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { eq } from 'drizzle-orm'

export const migrate = async () => {
  const nextcloud = getNextcloud()

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

  const areas = allAreas.filter((area) => area.parent != null && area.blocks.length > 0)

  const parentsMap = new Map(areas.map((area) => [area.parent!.id, area.parent!]))
  const parents = Array.from(parentsMap.values())

  await Promise.all(
    parents.map(async (parent) => {
      const areaPath = `/topos/${parent.slug}-${parent.id}`

      if (!(await nextcloud.exists(NEXTCLOUD_USER_NAME + areaPath))) {
        await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + areaPath)
      }
    }),
  )

  await Promise.all(
    areas.map(async (area) => {
      const parentPath = `/topos/${area.parent!.slug}-${area.parent!.id}`

      const areaPath = `${parentPath}/${area.slug}-${area.id}`

      if (!(await nextcloud.exists(NEXTCLOUD_USER_NAME + areaPath))) {
        await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + areaPath)
      }

      await new Promise((r) => setTimeout(r, 1000))

      const files = area.blocks.flatMap((block) => block.files.map((file) => ({ block, file })))

      await Promise.all(
        files.map(async ({ block, file }) => {
          const ext = file.path.split('.').at(-1) ?? ''
          const newPath = `${areaPath}/${block.slug}.${file.id}.${ext.toLowerCase()}`

          if (file.path !== newPath) {
            await nextcloud.copyFile(NEXTCLOUD_USER_NAME + file.path, NEXTCLOUD_USER_NAME + newPath)
            await db.update(schema.files).set({ path: newPath }).where(eq(schema.files.id, file.id))
          }
        }),
      )

      console.log('done with', area.name)
    }),
  )
}
