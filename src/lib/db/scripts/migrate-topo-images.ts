import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import { db } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { eq } from 'drizzle-orm'

export const migrate = async () => {
  const nextcloud = getNextcloud()

  const area = await db.query.areas.findFirst({
    where: eq(schema.areas.id, 587),
    with: {
      areas: {
        with: { blocks: { with: { files: true } } },
      },
    },
  })

  if (area == null) {
    return
  }

  const areaPath = `/topos/${area.slug}-${area.id}`
  await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + areaPath)

  await new Promise((r) => setTimeout(r, 1000))

  for await (const sector of area.areas) {
    console.log(sector.name)

    const sectorPath = `${areaPath}/${sector.slug}-${sector.id}`
    await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + sectorPath)

    await new Promise((r) => setTimeout(r, 1000))

    const files = sector.blocks.flatMap((block) => block.files.map((file) => ({ block, file })))

    await Promise.all(
      files.map(async ({ block, file }) => {
        const ext = file.path.split('.').at(-1) ?? ''
        const newPath = `${sectorPath}/${block.slug}.${file.id}.${ext.toLowerCase()}`

        await nextcloud.copyFile(NEXTCLOUD_USER_NAME + file.path, NEXTCLOUD_USER_NAME + newPath)
        await db.update(schema.files).set({ path: newPath }).where(eq(schema.files.id, file.id))
      }),
    )
  }
}
