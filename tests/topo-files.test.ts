import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  createOrUpdateGeolocation,
  createGeolocationFromFiles,
  prepare,
  insertTopos,
  renameAreaTopos,
  renameBlockTopos,
} from '$lib/topo-files.server'
import type { Block, InsertGeolocation } from '$lib/db/schema'
import { blocks, files, geolocations, topos } from '$lib/db/schema'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '$lib/db/schema'
import { eq, like, and } from 'drizzle-orm'
import sharp from 'sharp'
import exif from 'exifr'

// Mock environment variables
vi.mock('$env/static/private', () => ({
  NEXTCLOUD_USER_NAME: 'test-user',
}))

// Create reusable mock functions
const mockExists = vi.fn().mockResolvedValue(true)
const mockCreateDirectory = vi.fn().mockResolvedValue(undefined)
const mockPutFileContents = vi.fn().mockResolvedValue(true)
const mockMoveFile = vi.fn().mockResolvedValue(undefined)

// Mock Nextcloud client
vi.mock('$lib/nextcloud/nextcloud.server', () => ({
  getNextcloud: vi.fn(() => ({
    exists: mockExists,
    createDirectory: mockCreateDirectory,
    putFileContents: mockPutFileContents,
    moveFile: mockMoveFile,
  })),
}))

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(),
}))

// Mock exif
vi.mock('exifr', () => ({
  default: {
    gps: vi.fn().mockResolvedValue({ latitude: 47.123, longitude: 8.456 }),
  },
}))

// Mock data
const mockBlock = {
  id: 1,
  name: 'Test Block',
  slug: 'test-block',
  areaFk: 1,
  createdAt: new Date().toISOString(),
  createdBy: 1,
  geolocationFk: null,
} as Block

// Mock database with minimal implementation needed for tests
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 1, blockFk: 1, path: '', type: 'topo' }]),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
  query: {
    files: {
      findMany: vi.fn().mockResolvedValue([
        { id: 1, path: '/topos/old-area/sector/block.1.jpg' },
        { id: 2, path: '/topos/old-area/sector/block.2.jpg' },
      ]),
    },
  },
} as unknown as PostgresJsDatabase<typeof schema>

describe('Topo Files', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrUpdateGeolocation', () => {
    const geolocation: InsertGeolocation = { lat: 47.123, long: 8.456 }
    const blockWithGeo = { ...mockBlock, geolocationFk: 1 }

    describe('with operation="all" (default)', () => {
      it('should create new geolocation when block has none', async () => {
        await createOrUpdateGeolocation(mockDb, mockBlock, geolocation)

        expect(mockDb.insert).toHaveBeenCalledWith(geolocations)
        expect(mockDb.update).toHaveBeenCalledWith(blocks)
      })

      it('should update existing geolocation', async () => {
        await createOrUpdateGeolocation(mockDb, blockWithGeo, geolocation)

        expect(mockDb.update).toHaveBeenCalledWith(geolocations)
      })
    })

    describe('with operation="create"', () => {
      it('should create new geolocation when block has none', async () => {
        await createOrUpdateGeolocation(mockDb, mockBlock, geolocation, 'create')

        expect(mockDb.insert).toHaveBeenCalledWith(geolocations)
        expect(mockDb.update).toHaveBeenCalledWith(blocks)
      })

      it('should not update existing geolocation', async () => {
        await createOrUpdateGeolocation(mockDb, blockWithGeo, geolocation, 'create')

        expect(mockDb.update).not.toHaveBeenCalledWith(geolocations)
      })
    })

    describe('with operation="update"', () => {
      it('should not create new geolocation when block has none', async () => {
        await createOrUpdateGeolocation(mockDb, mockBlock, geolocation, 'update')

        expect(mockDb.insert).not.toHaveBeenCalled()
        expect(mockDb.update).not.toHaveBeenCalledWith(blocks)
      })

      it('should update existing geolocation', async () => {
        await createOrUpdateGeolocation(mockDb, blockWithGeo, geolocation, 'update')

        expect(mockDb.update).toHaveBeenCalledWith(geolocations)
      })
    })
  })

  describe('createGeolocationFromFiles', () => {
    it('should extract GPS data and create geolocation', async () => {
      const buffers = [Buffer.from('test-image-1'), Buffer.from('test-image-2')]
      await createGeolocationFromFiles(mockDb, mockBlock, buffers)

      expect(exif.gps).toHaveBeenCalledTimes(2)
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should handle files without GPS data', async () => {
      // @ts-expect-error - We want to test the null case
      vi.mocked(exif.gps).mockResolvedValueOnce(undefined)
      const buffers = [Buffer.from('test-image')]
      await createGeolocationFromFiles(mockDb, mockBlock, buffers)

      expect(mockDb.insert).not.toHaveBeenCalled()
    })

    it('should pass operation parameter to createOrUpdateGeolocation', async () => {
      const blockWithGeo = { ...mockBlock, geolocationFk: 1 }
      const buffers = [Buffer.from('test-image')]
      vi.mocked(exif.gps).mockResolvedValueOnce({ latitude: 47.123, longitude: 8.456 })

      await createGeolocationFromFiles(mockDb, blockWithGeo, buffers, 'update')

      expect(mockDb.update).toHaveBeenCalledWith(geolocations)
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('prepare', () => {
    const opts = { areaSlug: 'test-area', sectorSlug: 'test-sector', blockSlug: 'test-block' }

    it('should create directories if they dont exist', async () => {
      mockExists.mockResolvedValueOnce(false)
      const result = await prepare(opts)

      expect(mockCreateDirectory).toHaveBeenCalledWith('test-user/topos/test-area')
      expect(result).toBe('/topos/test-area/test-sector/test-block')
    })

    it('should skip directory creation if they exist', async () => {
      mockExists.mockResolvedValue(true)
      const result = await prepare(opts)

      expect(mockCreateDirectory).not.toHaveBeenCalled()
      expect(result).toBe('/topos/test-area/test-sector/test-block')
    })
  })

  describe('insertTopos', () => {
    const opts = {
      areaSlug: 'test-area',
      sectorSlug: 'test-sector',
      blockSlug: 'test-block',
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockExists.mockResolvedValue(true)
    })

    it('should process and upload images', async () => {
      const buffers = [new ArrayBuffer(8)]
      const mockResizedBuffer = Buffer.from('mock-image-data')
      const mockSharp = vi.mocked(sharp)
      const sharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 2048, height: 1024 }),
        resize: vi.fn().mockReturnThis(),
        keepMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockResizedBuffer),
      }
      mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

      await insertTopos(mockDb, mockBlock, buffers, opts)

      // Verify image processing
      expect(mockSharp).toHaveBeenCalledWith(buffers[0])
      expect(sharpInstance.resize).toHaveBeenCalledWith({ height: 1024 })
      expect(sharpInstance.keepMetadata).toHaveBeenCalled()
      expect(sharpInstance.jpeg).toHaveBeenCalled()

      // Verify file creation in database
      const insertValues = vi.mocked(mockDb.insert(files).values)
      expect(insertValues).toHaveBeenCalledWith({ blockFk: mockBlock.id, path: '', type: 'topo' })

      // Verify file upload to Nextcloud
      const expectedPath = '/topos/test-area/test-sector/test-block.1.jpg'
      expect(mockPutFileContents).toHaveBeenCalledWith('test-user' + expectedPath, mockResizedBuffer)

      // Verify file path update and topo creation
      // eslint-disable-next-line drizzle/enforce-update-with-where
      const updateSet = mockDb.update(files).set
      const updateWhere = updateSet({ path: expectedPath }).where
      expect(updateWhere).toHaveBeenCalledWith(eq(files.id, 1))
      expect(mockDb.insert).toHaveBeenCalledWith(topos)
    })

    it('should handle multiple images', async () => {
      const buffers = [new ArrayBuffer(8), new ArrayBuffer(8)]
      const mockResizedBuffer1 = Buffer.from('mock-image-data-1')
      const mockResizedBuffer2 = Buffer.from('mock-image-data-2')
      const mockSharp = vi.mocked(sharp)
      const sharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 2048, height: 1024 }),
        resize: vi.fn().mockReturnThis(),
        keepMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValueOnce(mockResizedBuffer1).mockResolvedValueOnce(mockResizedBuffer2),
      }
      mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

      await insertTopos(mockDb, mockBlock, buffers, opts)

      // Verify each image was processed
      expect(mockSharp).toHaveBeenCalledWith(buffers[0])
      expect(mockSharp).toHaveBeenCalledWith(buffers[1])

      // Verify file uploads to Nextcloud
      expect(mockPutFileContents).toHaveBeenCalledWith(
        'test-user/topos/test-area/test-sector/test-block.1.jpg',
        mockResizedBuffer1,
      )
      expect(mockPutFileContents).toHaveBeenCalledWith(
        'test-user/topos/test-area/test-sector/test-block.1.jpg',
        mockResizedBuffer2,
      )
    })

    it('should handle upload failures', async () => {
      mockPutFileContents.mockResolvedValueOnce(false)
      const buffers = [new ArrayBuffer(8)]
      const mockSharp = vi.mocked(sharp)
      const sharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 2048, height: 1024 }),
        resize: vi.fn().mockReturnThis(),
        keepMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      }
      mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

      await insertTopos(mockDb, mockBlock, buffers, opts)

      // Verify file cleanup
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      expect(mockDb.delete).toHaveBeenCalledWith(files)
      expect(mockDb.insert).not.toHaveBeenCalledWith(topos)
    })

    it('should handle empty buffer array', async () => {
      const buffers: ArrayBuffer[] = []
      await insertTopos(mockDb, mockBlock, buffers, opts)

      expect(sharp).not.toHaveBeenCalled()
      expect(mockPutFileContents).not.toHaveBeenCalled()
      expect(mockDb.insert).not.toHaveBeenCalledWith(files)
      expect(mockDb.insert).not.toHaveBeenCalledWith(topos)
    })

    it('should resize landscape images by height', async () => {
      const buffer = new ArrayBuffer(8)
      const mockSharp = vi.mocked(sharp)
      const sharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 2048, height: 1024 }),
        resize: vi.fn().mockReturnThis(),
        keepMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      }
      mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

      await insertTopos(mockDb, mockBlock, [buffer], opts)

      expect(sharpInstance.resize).toHaveBeenCalledWith({ height: 1024 })
    })

    it('should resize portrait images by width', async () => {
      const buffer = new ArrayBuffer(8)
      const mockSharp = vi.mocked(sharp)
      const sharpInstance = {
        metadata: vi.fn().mockResolvedValue({ width: 1024, height: 2048 }),
        resize: vi.fn().mockReturnThis(),
        keepMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      }
      mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

      await insertTopos(mockDb, mockBlock, [buffer], opts)

      expect(sharpInstance.resize).toHaveBeenCalledWith({ width: 1024 })
    })
  })

  describe('renameArea', () => {
    const mockFiles = [
      {
        id: 1,
        path: '/topos/old-area/sector/block.1.jpg',
        type: 'topo' as const,
        blockFk: 1,
        routeFk: null,
        ascentFk: null,
        areaFk: null,
      },
      {
        id: 2,
        path: '/topos/old-area/sector/block.2.jpg',
        type: 'topo' as const,
        blockFk: 1,
        routeFk: null,
        ascentFk: null,
        areaFk: null,
      },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
      mockExists.mockResolvedValue(true)
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue(mockFiles)
    })

    it('should skip processing if old and new slugs are the same', async () => {
      await renameAreaTopos(mockDb, 'same-slug', 'same-slug')

      expect(mockMoveFile).not.toHaveBeenCalled()
      expect(mockDb.update).not.toHaveBeenCalled()
    })

    it('should rename files and update database records', async () => {
      const oldSlug = 'old-area'
      const newSlug = 'new-area'

      await renameAreaTopos(mockDb, oldSlug, newSlug)

      // Verify file query
      expect(mockDb.query.files.findMany).toHaveBeenCalledWith({
        where: like(schema.files.path, `%${oldSlug}%`),
      })

      // Verify Nextcloud file moves
      expect(mockMoveFile).toHaveBeenCalledWith('test-user/topos/old-area', 'test-user/topos/new-area')

      // Verify database updates for each file
      mockFiles.forEach((file) => {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const updateSet = mockDb.update(files).set
        const updateWhere = updateSet({
          path: file.path.replace(oldSlug, newSlug),
        }).where
        expect(updateWhere).toHaveBeenCalledWith(eq(files.id, file.id))
      })
    })

    it('should handle non-existent directories', async () => {
      mockExists.mockResolvedValue(false)
      await renameAreaTopos(mockDb, 'old-area', 'new-area')

      expect(mockMoveFile).not.toHaveBeenCalled()

      // Should still update database records even if directory doesn't exist
      mockFiles.forEach((file) => {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const updateSet = mockDb.update(files).set
        const updateWhere = updateSet({
          path: file.path.replace('old-area', 'new-area'),
        }).where
        expect(updateWhere).toHaveBeenCalledWith(eq(files.id, file.id))
      })
    })

    it('should handle files in subdirectories', async () => {
      const filesWithSubdirs = [
        {
          id: 1,
          path: '/topos/old-area/sector1/subsector/block.1.jpg',
          type: 'topo' as const,
          blockFk: 1,
          routeFk: null,
          ascentFk: null,
          areaFk: null,
        },
        {
          id: 2,
          path: '/topos/old-area/sector2/deep/nested/block.2.jpg',
          type: 'topo' as const,
          blockFk: 1,
          routeFk: null,
          ascentFk: null,
          areaFk: null,
        },
      ]
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue(filesWithSubdirs)

      await renameAreaTopos(mockDb, 'old-area', 'new-area')

      // Should only move the root directory once
      expect(mockMoveFile).toHaveBeenCalledTimes(1)

      // Verify database updates for nested files
      filesWithSubdirs.forEach((file) => {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const updateSet = mockDb.update(files).set
        const updateWhere = updateSet({
          path: file.path.replace('old-area', 'new-area'),
        }).where
        expect(updateWhere).toHaveBeenCalledWith(eq(files.id, file.id))
      })
    })
  })

  describe('renameBlockTopos', () => {
    const mockTopoFiles = [
      {
        id: 1,
        path: '/topos/area/sector/old-block.1.jpg',
        type: 'topo' as const,
        blockFk: 1,
        routeFk: null,
        ascentFk: null,
        areaFk: null,
      },
      {
        id: 2,
        path: '/topos/area/sector/old-block.2.jpg',
        type: 'topo' as const,
        blockFk: 1,
        routeFk: null,
        ascentFk: null,
        areaFk: null,
      },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
      mockExists.mockResolvedValue(true)
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue(mockTopoFiles)
    })

    it('should rename topo files for a block', async () => {
      const blockId = 1
      const newSlug = 'new-block'

      await renameBlockTopos(mockDb, blockId, newSlug)

      // Verify file query
      expect(mockDb.query.files.findMany).toHaveBeenCalledWith({
        where: and(eq(schema.files.blockFk, blockId), eq(schema.files.type, 'topo')),
      })

      // Verify Nextcloud file moves
      mockTopoFiles.forEach((file) => {
        const oldPath = file.path
        const newPath = `/topos/area/sector/new-block.${file.id}.jpg`
        expect(mockMoveFile).toHaveBeenCalledWith('test-user' + oldPath, 'test-user' + newPath)
      })

      // Verify database updates
      mockTopoFiles.forEach((file) => {
        const newPath = `/topos/area/sector/new-block.${file.id}.jpg`
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const updateSet = mockDb.update(files).set
        const updateWhere = updateSet({ path: newPath }).where
        expect(updateWhere).toHaveBeenCalledWith(eq(files.id, file.id))
      })
    })

    it('should handle case when no files exist', async () => {
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue([])

      await renameBlockTopos(mockDb, 1, 'new-block')

      expect(mockMoveFile).not.toHaveBeenCalled()
      expect(mockDb.update).not.toHaveBeenCalled()
    })

    it('should skip files that already have the correct name', async () => {
      const mockFiles = [
        {
          id: 1,
          path: '/topos/area/sector/new-block.1.jpg',
          type: 'topo' as const,
          blockFk: 1,
          routeFk: null,
          ascentFk: null,
          areaFk: null,
        },
      ]
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue(mockFiles)

      await renameBlockTopos(mockDb, 1, 'new-block')

      expect(mockMoveFile).not.toHaveBeenCalled()
      expect(mockDb.update).not.toHaveBeenCalled()
    })

    it('should preserve file extensions', async () => {
      const mockFiles = [
        {
          id: 1,
          path: '/topos/area/sector/old-block.custom.1.jpg',
          type: 'topo' as const,
          blockFk: 1,
          routeFk: null,
          ascentFk: null,
          areaFk: null,
        },
      ]
      vi.mocked(mockDb.query.files.findMany).mockResolvedValue(mockFiles)

      await renameBlockTopos(mockDb, 1, 'new-block')

      const [basename] = mockFiles[0].path.split('/').reverse()
      const [, , ext] = basename.split('.')
      const expectedNewPath = `/topos/area/sector/new-block.${mockFiles[0].id}.${ext}`
      expect(mockMoveFile).toHaveBeenCalledWith('test-user' + mockFiles[0].path, 'test-user' + expectedNewPath)
      // eslint-disable-next-line drizzle/enforce-update-with-where
      const updateSet = mockDb.update(files).set
      const updateWhere = updateSet({ path: expectedNewPath }).where
      expect(updateWhere).toHaveBeenCalledWith(eq(files.id, mockFiles[0].id))
    })
  })
})
