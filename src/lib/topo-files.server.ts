import { NEXTCLOUD_USER_NAME } from '$env/static/private'
import * as schema from '$lib/db/schema'
import { getNextcloud } from '$lib/nextcloud/nextcloud.server'
import { eq, like } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import exif from 'exifr'
import sharp from 'sharp'

export const createOrUpdateGeolocation = async (
  db: PostgresJsDatabase<typeof schema>,
  block: schema.Block,
  geolocation: schema.InsertGeolocation,
  operation: 'create' | 'update' | 'all' = 'all',
) => {
  // If the block does not have a geolocation, insert a new geolocation record
  if (block.geolocationFk == null && (operation === 'create' || operation === 'all')) {
    const [createdGeolocation] = await db
      .insert(schema.geolocations)
      .values({ ...geolocation, blockFk: block.id })
      .returning()
    // Update the block with the new geolocation foreign key
    await db.update(schema.blocks).set({ geolocationFk: createdGeolocation.id }).where(eq(schema.blocks.id, block.id))
  }

  if (block.geolocationFk != null && (operation === 'update' || operation === 'all')) {
    // If the block already has a geolocation, update the existing geolocation record
    await db.update(schema.geolocations).set(geolocation).where(eq(schema.geolocations.id, block.geolocationFk!))
  }
}

export const createGeolocationFromFiles = async (
  db: PostgresJsDatabase<typeof schema>,
  block: schema.Block,
  buffers: ArrayBuffer[],
  operation: 'create' | 'update' | 'all' = 'all',
) => {
  const allGps = await Promise.all(buffers.map((buffer) => exif.gps(buffer)))
  const nonNullGps = allGps.filter((d) => d != null)

  const sumGps = nonNullGps.reduce(
    (sum, gps) => {
      return {
        ...sum,
        latitude: (sum?.latitude ?? 0) + gps.latitude,
        longitude: (sum?.longitude ?? 0) + gps.longitude,
      }
    },
    undefined as Awaited<ReturnType<typeof exif.gps>> | undefined,
  )

  if (block == null || sumGps == null) {
    return
  }

  const geolocation: schema.InsertGeolocation = {
    lat: sumGps.latitude / nonNullGps.length,
    long: sumGps.longitude / nonNullGps.length,
  }

  await createOrUpdateGeolocation(db, block, geolocation, operation)
}

interface Opts {
  areaSlug: string
  sectorSlug: string
  blockSlug: string
}

export const prepare = async ({ areaSlug, blockSlug, sectorSlug }: Opts): Promise<string> => {
  const nextcloud = getNextcloud()

  const areaPath = `/topos/${areaSlug}`
  const areaExists = await nextcloud.exists(NEXTCLOUD_USER_NAME + areaPath)
  if (!areaExists) {
    await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + areaPath)
    await new Promise((r) => setTimeout(r, 100))
  }

  const sectorPath = `${areaPath}/${sectorSlug}`
  const sectorExists = await nextcloud.exists(NEXTCLOUD_USER_NAME + sectorPath)
  if (!sectorExists) {
    await nextcloud.createDirectory(NEXTCLOUD_USER_NAME + sectorPath)
    await new Promise((r) => setTimeout(r, 100))
  }

  return `${sectorPath}/${blockSlug}`
}

export const insertTopos = async (
  db: PostgresJsDatabase<typeof schema>,
  block: schema.Block,
  buffers: ArrayBuffer[],
  opts: Opts,
) => {
  const fileName = buffers.length === 0 ? '' : await prepare(opts)

  await Promise.all(
    buffers.map(async (buffer) => {
      const image = sharp(buffer)
      const metadata = await image.metadata()

      const resizeOpts: sharp.ResizeOptions =
        (metadata.width ?? 0) > (metadata.height ?? 0) ? { height: 1024 } : { width: 1024 }
      const resized = await image.resize(resizeOpts).keepMetadata().jpeg().toBuffer()

      const [fileResult] = await db
        .insert(schema.files)
        .values({ blockFk: block.id, path: '', type: 'topo' })
        .returning()

      const filePath = `${fileName}.${fileResult.id}.jpg`
      const success = await getNextcloud().putFileContents(NEXTCLOUD_USER_NAME + filePath, resized)

      if (success) {
        await db.update(schema.files).set({ path: filePath }).where(eq(schema.files.id, fileResult.id))
        await db.insert(schema.topos).values({ blockFk: block.id, fileFk: fileResult.id })
      } else {
        await db.delete(schema.files).where(eq(schema.files.id, fileResult.id))
      }
    }),
  )
}

export const renameArea = async (db: PostgresJsDatabase<typeof schema>, oldSlug: string, newSlug: string) => {
  if (oldSlug === newSlug) {
    return
  }

  const nextcloud = getNextcloud()
  const topoFiles = await db.query.files.findMany({ where: like(schema.files.path, `%${oldSlug}%`) })

  const allPaths = topoFiles
    .map((file) => {
      const index = file.path.indexOf(oldSlug)

      if (index >= 0) {
        return file.path.slice(0, index + oldSlug.length)
      }
    })
    .filter(Boolean) as string[]

  const paths = Array.from(new Set(allPaths))

  await Promise.all(
    paths.map(async (oldPath) => {
      const exists = await nextcloud.exists(NEXTCLOUD_USER_NAME + oldPath)

      if (!exists) {
        return
      }

      const newPath = oldPath.replace(oldSlug, newSlug)

      await nextcloud.moveFile(NEXTCLOUD_USER_NAME + oldPath, NEXTCLOUD_USER_NAME + newPath)
    }),
  )

  await Promise.all(
    topoFiles.map((file) =>
      db
        .update(schema.files)
        .set({ path: file.path.replace(oldSlug, newSlug) })
        .where(eq(schema.files.id, file.id)),
    ),
  )
}
