import { loadFeed, createUpdateActivity } from '$lib/components/ActivityFeed/load.server'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '$lib/db/schema'
import type { SupabaseClient, User as AuthUser, Session } from '@supabase/supabase-js'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import { EDIT_PERMISSION, READ_PERMISSION } from '$lib/auth'
import type { PgTransaction } from 'drizzle-orm/pg-core'

// Mock external dependencies
vi.mock('$lib/db/db.server', () => ({
  createDrizzleSupabaseClient: vi.fn(),
}))

vi.mock('$lib/markdown', () => ({
  convertMarkdownToHtml: vi.fn((text) => Promise.resolve(`<p>${text}</p>`)),
}))

interface FileWithPath {
  path: string
  [key: string]: unknown
}

vi.mock('$lib/nextcloud/nextcloud.server', () => ({
  loadFiles: vi.fn((files: FileWithPath[]) =>
    Promise.resolve(
      files.map((file) => ({
        ...file,
        stat: {
          filename: file.path,
          basename: file.path.split('/').pop(),
          lastmod: new Date().toISOString(),
          size: 1024,
          type: 'file',
        },
      })),
    ),
  ),
}))

// Mock data
const mockArea = {
  id: 1,
  name: 'Test Area',
  description: 'Test Description',
  parentFk: null,
  parent: null,
}

const mockBlock = {
  id: 1,
  name: 'Test Block',
  area: mockArea,
}

const mockRoute = {
  id: 1,
  name: 'Test Route',
  description: 'Test Description',
  block: mockBlock,
}

const mockAscent = {
  id: 1,
  notes: 'Test Notes',
  files: [{ id: 1, path: '/test/image.jpg' }],
  author: { id: 1, name: 'Test User' },
}

const mockActivity = {
  id: 1,
  type: 'created',
  entityType: 'ascent',
  entityId: 1,
  userFk: 1,
  createdAt: new Date().toISOString(),
  parentEntityId: null,
  parentEntityType: null,
  columnName: null,
  oldValue: null,
  newValue: null,
} as const

const mockSupabase = {
  supabaseUrl: 'http://localhost:54321',
  supabaseKey: 'test-key',
  auth: {},
  realtime: {},
  from: () => ({}),
  rpc: () => ({}),
  storage: () => ({}),
  channel: () => ({}),
  rest: {},
  graphql: {},
  functions: {},
} as unknown as SupabaseClient

const mockLocals = {
  supabase: mockSupabase,
  safeGetSession: async () => ({
    session: null as Session | null,
    user: null as AuthUser | null,
    userPermissions: [READ_PERMISSION, EDIT_PERMISSION] as Array<typeof READ_PERMISSION | typeof EDIT_PERMISSION>,
    userRole: 'anonymous' as string | undefined,
  }),
  session: null as Session | null,
  user: null as AuthUser | null,
  userPermissions: [READ_PERMISSION, EDIT_PERMISSION] as Array<typeof READ_PERMISSION | typeof EDIT_PERMISSION>,
  userRole: 'anonymous' as string | undefined,
}

type MockDb = {
  query: {
    activities: {
      findMany: ReturnType<typeof vi.fn>
    }
    areas: {
      findFirst: ReturnType<typeof vi.fn>
    }
    blocks: {
      findFirst: ReturnType<typeof vi.fn>
    }
    routes: {
      findFirst: ReturnType<typeof vi.fn>
    }
    ascents: {
      findFirst: ReturnType<typeof vi.fn>
    }
  }
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
}

describe('Activity Feed', () => {
  let mockDb: MockDb

  beforeEach(() => {
    const whereMock = {
      where: vi.fn().mockReturnValue([{ count: 10 }]),
    }

    const fromMock = {
      from: vi.fn().mockReturnValue(whereMock),
    }

    mockDb = {
      query: {
        activities: {
          findMany: vi.fn().mockResolvedValue([{ ...mockActivity, user: { id: 1, name: 'Test User' } }]),
        },
        areas: {
          findFirst: vi.fn().mockResolvedValue(mockArea),
        },
        blocks: {
          findFirst: vi.fn().mockResolvedValue(mockBlock),
        },
        routes: {
          findFirst: vi.fn().mockResolvedValue(mockRoute),
        },
        ascents: {
          findFirst: vi.fn().mockResolvedValue(mockAscent),
        },
      },
      select: vi.fn().mockReturnValue(fromMock),
      insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    }

    const dbWithTransaction = async <T>(fn: (tx: PgTransaction<any, any, any>) => Promise<T>) => fn(mockDb as any)
    vi.mocked(createDrizzleSupabaseClient).mockResolvedValue(dbWithTransaction)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('loadFeed', () => {
    it('should load activities with pagination', async () => {
      const result = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed?page=1&pageSize=10'),
      })

      expect(result.activities).toHaveLength(1)
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 10,
        totalPages: 1,
      })
    })

    it('should filter activities by type', async () => {
      await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed?type=ascents'),
      })

      expect(mockDb.query.activities.findMany).toHaveBeenCalled()
      const findManyCall = vi.mocked(mockDb.query.activities.findMany).mock.calls[0][0]
      expect(findManyCall).toHaveProperty('where')
    })

    it('should process different entity types correctly', async () => {
      // Test area activity
      vi.mocked(mockDb.query.activities.findMany).mockResolvedValueOnce([
        { ...mockActivity, entityType: 'area', entityId: 1, user: { id: 1, name: 'Test User' } },
      ])

      const areaResult = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed'),
      })

      expect(areaResult.activities[0].entityType).toBe('area')
      expect(areaResult.activities[0].entity.type).toBe('area')

      // Test route activity
      vi.mocked(mockDb.query.activities.findMany).mockResolvedValueOnce([
        { ...mockActivity, entityType: 'route', entityId: 1, user: { id: 1, name: 'Test User' } },
      ])

      const routeResult = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed'),
      })

      expect(routeResult.activities[0].entityType).toBe('route')
      expect(routeResult.activities[0].entity.type).toBe('route')
    })

    it('should handle invalid search params', async () => {
      await expect(
        loadFeed({
          locals: mockLocals,
          url: new URL('http://localhost:3000/feed?page=invalid'),
        }),
      ).rejects.toThrow()
    })
  })

  describe('createUpdateActivity', () => {
    it('should create activities for changed fields', async () => {
      const oldEntity = { name: 'Old Name', description: 'Old Description' }
      const newEntity = { name: 'New Name', description: 'Old Description' }

      await createUpdateActivity({
        oldEntity,
        newEntity,
        db: mockDb as unknown as PostgresJsDatabase<typeof schema>,
        entityId: 1,
        entityType: 'route',
        userFk: 1,
        parentEntityId: null,
        parentEntityType: null,
      })

      expect(mockDb.insert).toHaveBeenCalledWith(schema.activities)
      expect(mockDb.insert).toHaveBeenCalledTimes(1)
    })

    it('should handle null values correctly', async () => {
      const oldEntity = { name: 'Old Name', description: null }
      const newEntity = { name: 'Old Name', description: 'New Description' }

      await createUpdateActivity({
        oldEntity,
        newEntity,
        db: mockDb as unknown as PostgresJsDatabase<typeof schema>,
        entityId: 1,
        entityType: 'route',
        userFk: 1,
        parentEntityId: null,
        parentEntityType: null,
      })

      expect(mockDb.insert).toHaveBeenCalledWith(schema.activities)
    })

    it('should not create activities when no changes', async () => {
      const entity = { name: 'Same Name', description: 'Same Description' }

      await createUpdateActivity({
        oldEntity: entity,
        newEntity: entity,
        db: mockDb as unknown as PostgresJsDatabase<typeof schema>,
        entityId: 1,
        entityType: 'route',
        userFk: 1,
        parentEntityId: null,
        parentEntityType: null,
      })

      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })
})
