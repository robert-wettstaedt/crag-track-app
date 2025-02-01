import { EDIT_PERMISSION, READ_PERMISSION } from '$lib/auth'
import type { ActivityDTO, Entity } from '$lib/components/ActivityFeed'
import { createUpdateActivity, groupActivities, loadFeed } from '$lib/components/ActivityFeed/load.server'
import { config } from '$lib/config'
import { createDrizzleSupabaseClient } from '$lib/db/db.server'
import * as schema from '$lib/db/schema'
import type { User as AuthUser, Session, SupabaseClient } from '@supabase/supabase-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

    const dbWithTransaction = async <T>(fn: (tx: any) => Promise<T>) => fn(mockDb as any)
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
      expect(result.activities[0].items).toHaveLength(1)
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

      expect(areaResult.activities[0].items[0].entityType).toBe('area')
      expect(areaResult.activities[0].entity.type).toBe('area')

      // Test route activity
      vi.mocked(mockDb.query.activities.findMany).mockResolvedValueOnce([
        { ...mockActivity, entityType: 'route', entityId: 1, user: { id: 1, name: 'Test User' } },
      ])

      const routeResult = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed'),
      })

      expect(routeResult.activities[0].items[0].entityType).toBe('route')
      expect(routeResult.activities[0].entity.type).toBe('route')
    })

    it('should group related activities', async () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const fortyMinutesAgo = new Date(now.getTime() - 40 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      vi.mocked(mockDb.query.activities.findMany).mockResolvedValueOnce([
        {
          ...mockActivity,
          id: 1,
          entityType: 'block',
          entityId: 1,
          parentEntityId: 100,
          parentEntityType: 'area',
          userFk: 1,
          createdAt: now.toISOString(),
          user: { id: 1, name: 'Test User' },
        },
        {
          ...mockActivity,
          id: 2,
          entityType: 'block',
          entityId: 1,
          parentEntityId: 100,
          parentEntityType: 'area',
          userFk: 1,
          createdAt: fiveMinutesAgo.toISOString(),
          user: { id: 1, name: 'Test User' },
        },
        {
          ...mockActivity,
          id: 3,
          entityType: 'block',
          entityId: 2,
          parentEntityId: 100,
          parentEntityType: 'area',
          userFk: 1,
          createdAt: fortyMinutesAgo.toISOString(),
          user: { id: 1, name: 'Test User' },
        },
        {
          ...mockActivity,
          id: 4,
          entityType: 'block',
          entityId: 1,
          parentEntityId: 100,
          parentEntityType: 'area',
          userFk: 2,
          createdAt: oneHourAgo.toISOString(),
          user: { id: 2, name: 'Other User' },
        },
      ])

      const result = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed'),
      })

      // Should create 2 groups:
      // 1. Three activities for blocks by user 1 (all within 3 hours and same parent area)
      // 2. One activity for block by user 2
      expect(result.activities).toHaveLength(2)

      // First group should have 3 activities (all connected by parent area)
      expect(result.activities[0].items).toHaveLength(3)
      expect(result.activities[0].items.map((i) => i.id)).toEqual([1, 2, 3])
      expect(result.activities[0].user.id).toBe(1)
      expect(result.activities[0].latestDate).toEqual(now)

      // Second group should have 1 activity (different user)
      expect(result.activities[1].items).toHaveLength(1)
      expect(result.activities[1].items[0].id).toBe(4)
      expect(result.activities[1].user.id).toBe(2)
    })

    it('should group activities without parent entities', async () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      vi.mocked(mockDb.query.activities.findMany).mockResolvedValueOnce([
        {
          ...mockActivity,
          id: 1,
          entityType: 'area',
          entityId: 1,
          parentEntityId: null,
          parentEntityType: null,
          userFk: 1,
          createdAt: now.toISOString(),
          user: { id: 1, name: 'Test User' },
        },
        {
          ...mockActivity,
          id: 2,
          entityType: 'area',
          entityId: 1,
          parentEntityId: null,
          parentEntityType: null,
          userFk: 1,
          createdAt: fiveMinutesAgo.toISOString(),
          user: { id: 1, name: 'Test User' },
        },
      ])

      const result = await loadFeed({
        locals: mockLocals,
        url: new URL('http://localhost:3000/feed'),
      })

      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].items).toHaveLength(2)
      expect(result.activities[0].parentEntity).toBeUndefined()
      expect(result.activities[0].entity.type).toBe('area')
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

  describe('groupActivities', () => {
    const mockUser = {
      id: 1,
      authUserFk: 'auth0|123',
      username: 'Test User',
      firstAscensionistFk: null,
      userSettingsFk: null,
      createdAt: new Date().toISOString(),
    }

    const mockOtherUser = {
      id: 2,
      authUserFk: 'auth0|456',
      username: 'Other User',
      firstAscensionistFk: null,
      userSettingsFk: null,
      createdAt: new Date().toISOString(),
    }

    const mockRoute = (id: number): Entity => ({
      type: 'route',
      object: {
        id,
        name: `Route ${id}`,
        createdAt: new Date().toISOString(),
        description: null,
        slug: `route-${id}`,
        createdBy: 1,
        gradeFk: null,
        rating: null,
        firstAscentYear: null,
        blockFk: 1,
        externalResourcesFk: null,
      },
    })

    const mockBlock = (id: number): Entity => ({
      type: 'block',
      object: {
        id,
        name: `Block ${id}`,
        createdAt: new Date().toISOString(),
        slug: `block-${id}`,
        createdBy: 1,
        areaFk: 100,
        geolocationFk: null,
        order: 0,
      },
    })

    const mockArea = (id: number): Entity => ({
      type: 'area',
      object: {
        id,
        name: `Area ${id}`,
        createdAt: new Date().toISOString(),
        description: null,
        slug: `area-${id}`,
        type: 'area',
        visibility: 'public',
        parentFk: null,
        createdBy: 1,
      },
    })

    it('should group activities by the same user within time limit and entity relationships', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

      const activities: ActivityDTO[] = [
        {
          id: 1,
          type: 'created',
          entityType: 'route',
          entityId: 1,
          userFk: 1,
          createdAt: now.toISOString(),
          user: mockUser,
          entity: mockRoute(1),
          parentEntityId: 1, // Same parent block
          parentEntityType: 'block',
          parentEntity: mockBlock(1),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
        {
          id: 2,
          type: 'created',
          entityType: 'route',
          entityId: 2,
          userFk: 1,
          createdAt: oneHourAgo.toISOString(),
          user: mockUser,
          entity: mockRoute(2),
          parentEntityId: 1, // Same parent block
          parentEntityType: 'block',
          parentEntity: mockBlock(1),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
        {
          id: 3,
          type: 'created',
          entityType: 'route',
          entityId: 3,
          userFk: 1,
          createdAt: fourHoursAgo.toISOString(),
          user: mockUser,
          entity: mockRoute(3),
          parentEntityId: 2, // Different parent block
          parentEntityType: 'block',
          parentEntity: mockBlock(2),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
      ]

      const result = groupActivities(activities)

      // Test that activities within time limit and same parent are grouped together
      const groups = result.map((group) => group.items.map((item) => new Date(item.createdAt).getTime()))

      // Verify each group's time span is within the configured limit
      groups.forEach((groupTimes) => {
        const timeSpan = Math.max(...groupTimes) - Math.min(...groupTimes)
        expect(timeSpan).toBeLessThanOrEqual(config.activityFeed.groupTimeLimit)
      })

      // Verify that activities beyond time limit or different parents are in different groups
      const allPairs = result.flatMap((group) =>
        group.items.flatMap((item1) =>
          group.items.map((item2) => ({
            time1: new Date(item1.createdAt).getTime(),
            time2: new Date(item2.createdAt).getTime(),
            sameParent: item1.parentEntityId === item2.parentEntityId,
          })),
        ),
      )

      allPairs.forEach(({ time1, time2, sameParent }) => {
        const timeDiff = Math.abs(time1 - time2)
        expect(timeDiff).toBeLessThanOrEqual(config.activityFeed.groupTimeLimit)
        expect(sameParent).toBe(true)
      })

      // Verify the grouping structure
      expect(result).toHaveLength(2)
      expect(result[0].items).toHaveLength(2) // First group has activities within time limit and same parent
      expect(result[1].items).toHaveLength(1) // Second group has the activity with different parent
    })

    it('should group activities by connected entities', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const activities: ActivityDTO[] = [
        {
          id: 1,
          type: 'created',
          entityType: 'block',
          entityId: 1,
          parentEntityType: 'area',
          parentEntityId: 100,
          userFk: 1,
          createdAt: now.toISOString(),
          user: mockUser,
          entity: mockBlock(1),
          parentEntity: mockArea(100),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
        {
          id: 2,
          type: 'created',
          entityType: 'route',
          entityId: 1,
          parentEntityType: 'block',
          parentEntityId: 1,
          userFk: 1,
          createdAt: fiveMinutesAgo.toISOString(),
          user: mockUser,
          entity: mockRoute(1),
          parentEntity: mockBlock(1),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
      ]

      const result = groupActivities(activities)
      expect(result).toHaveLength(1) // Should be grouped together due to connected entities
      expect(result[0].items).toHaveLength(2)
    })

    it('should not group activities from different users', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const activities: ActivityDTO[] = [
        {
          id: 1,
          type: 'created',
          entityType: 'route',
          entityId: 1,
          userFk: 1,
          createdAt: now.toISOString(),
          user: mockUser,
          entity: mockRoute(1),
          parentEntityId: null,
          parentEntityType: null,
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
        {
          id: 2,
          type: 'created',
          entityType: 'route',
          entityId: 1,
          userFk: 2,
          createdAt: fiveMinutesAgo.toISOString(),
          user: mockOtherUser,
          entity: mockRoute(1),
          parentEntityId: null,
          parentEntityType: null,
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
      ]

      const result = groupActivities(activities)
      expect(result).toHaveLength(2) // Should be in separate groups due to different users
      expect(result[0].items).toHaveLength(1)
      expect(result[1].items).toHaveLength(1)
    })

    it('should handle empty activities array', () => {
      const result = groupActivities([])
      expect(result).toHaveLength(0)
    })

    it('should group activities with shared parent entities', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const activities: ActivityDTO[] = [
        {
          id: 1,
          type: 'created',
          entityType: 'route',
          entityId: 1,
          parentEntityType: 'block',
          parentEntityId: 100,
          userFk: 1,
          createdAt: now.toISOString(),
          user: mockUser,
          entity: mockRoute(1),
          parentEntity: mockBlock(100),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
        {
          id: 2,
          type: 'created',
          entityType: 'route',
          entityId: 2,
          parentEntityType: 'block',
          parentEntityId: 100,
          userFk: 1,
          createdAt: fiveMinutesAgo.toISOString(),
          user: mockUser,
          entity: mockRoute(2),
          parentEntity: mockBlock(100),
          columnName: null,
          oldValue: null,
          newValue: null,
          metadata: null,
        },
      ]

      const result = groupActivities(activities)
      expect(result).toHaveLength(1) // Should be grouped together due to shared parent
      expect(result[0].items).toHaveLength(2)
      expect(result[0].parentEntity).toBeDefined()
      const parentEntity = result[0].parentEntity
      expect(parentEntity?.object?.id).toBe(100)
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
