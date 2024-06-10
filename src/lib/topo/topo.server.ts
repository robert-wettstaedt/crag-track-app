import { loadFiles } from '$lib/nextcloud/nextcloud.server'
import type { Session } from '@auth/sveltekit'
import { eq } from 'drizzle-orm'
import { convertPathToPoints, type RouteDTO, type TopoDTO } from '.'
import { db } from '../db/db.server'
import { blocks, files, topos } from '../db/schema'

export const getTopos = async (
  blockId: number,
  session: Session | null | undefined,
  fileId?: number,
): Promise<TopoDTO[]> => {
  const block = await db.query.blocks.findFirst({
    where: eq(blocks.id, blockId),
    with: {
      files: {
        where: fileId == null ? eq(files.type, 'topo') : eq(files.id, fileId),
      },
    },
  })

  if (block == null) {
    return []
  }

  const fileInfos = await loadFiles(block.files, session)

  const toposResult = await db.query.topos.findMany({
    where: eq(topos.blockFk, blockId),
    with: {
      routes: true,
    },
  })

  return toposResult
    .map((topo): TopoDTO => {
      const index = fileInfos.findIndex((file) => file.id === topo.fileFk)
      const file = fileInfos.splice(index, 1)[0]

      const routes = topo.routes.map(({ path, ...route }): RouteDTO => {
        return { ...route, points: convertPathToPoints(path ?? '') }
      })

      return { ...topo, file, routes }
    })
    .filter((topo) => topo.file != null)
}
