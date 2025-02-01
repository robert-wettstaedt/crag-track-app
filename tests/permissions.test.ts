import { EDIT_PERMISSION, READ_PERMISSION } from '$lib/auth'
import { db } from '$lib/db/db.server'
import { appRole } from '$lib/db/schema'
import { supabase } from '$lib/hooks/auth'
import type { RequestEvent } from '@sveltejs/kit'
import { render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AreasPage from '../src/routes/(app)/areas/+page.svelte'

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => ({ data: { session: {} } })),
      getUser: vi.fn(() => ({ data: { user: {} } })),
    },
  })),
}))

// Mock database client
vi.mock('$lib/db/db.server', () => ({
  db: {
    query: {
      userRoles: {
        findFirst: vi.fn(),
      },
      rolePermissions: {
        findMany: vi.fn(),
      },
    },
  },
}))

// Mock environment variables
vi.mock('$env/static/public', () => ({
  PUBLIC_APPLICATION_NAME: 'Test App',
  PUBLIC_SUPABASE_URL: '',
  PUBLIC_SUPABASE_ANON_KEY: '',
}))

describe('Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Auth Hook Permissions', () => {
    const createMockEvent = () =>
      ({
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([]),
          set: vi.fn(),
        },
      }) as unknown as RequestEvent

    it('should grant maintainer all permissions', async () => {
      const event = createMockEvent()

      vi.mocked(db.query.userRoles.findFirst).mockResolvedValue({
        id: 1,
        role: appRole.enumValues[1],
        authUserFk: '1',
      })
      vi.mocked(db.query.rolePermissions.findMany).mockResolvedValue([
        { id: 1, role: appRole.enumValues[1], permission: READ_PERMISSION },
        { id: 2, role: appRole.enumValues[1], permission: EDIT_PERMISSION },
      ])

      await supabase({ event, resolve: vi.fn() })
      const { userPermissions, userRole } = await event.locals.safeGetSession()

      expect(userRole).toBe(appRole.enumValues[1])
      expect(userPermissions).toContain(READ_PERMISSION)
      expect(userPermissions).toContain(EDIT_PERMISSION)
    })

    it('should grant regular users only read permissions', async () => {
      const event = createMockEvent()

      vi.mocked(db.query.userRoles.findFirst).mockResolvedValue({
        id: 1,
        role: appRole.enumValues[0],
        authUserFk: '1',
      })
      vi.mocked(db.query.rolePermissions.findMany).mockResolvedValue([
        { id: 1, role: appRole.enumValues[0], permission: READ_PERMISSION },
      ])

      await supabase({ event, resolve: vi.fn() })
      const { userPermissions, userRole } = await event.locals.safeGetSession()

      expect(userRole).toBe(appRole.enumValues[0])
      expect(userPermissions).toContain(READ_PERMISSION)
      expect(userPermissions).not.toContain(EDIT_PERMISSION)
    })
  })

  describe('UI Permission Checks', () => {
    it('should show "Add area" button for users with EDIT_PERMISSION', () => {
      const mockData = {
        areas: [],
        userPermissions: [READ_PERMISSION, EDIT_PERMISSION],
      } as unknown as Parameters<typeof AreasPage>[1]['data']

      render(AreasPage, { data: mockData })

      const addButton = screen.queryByText('Add area')
      expect(addButton).toBeInTheDocument()
    })

    it('should hide "Add area" button for users without EDIT_PERMISSION', () => {
      const mockData = {
        areas: [],
        userPermissions: [READ_PERMISSION],
      } as unknown as Parameters<typeof AreasPage>[1]['data']

      render(AreasPage, { data: mockData })

      const addButton = screen.queryByText('Add area')
      expect(addButton).not.toBeInTheDocument()
    })

    it('should show areas list for users with READ_PERMISSION', () => {
      const mockData = {
        areas: [
          { id: 1, name: 'Test Area 1', slug: 'test-area-1' },
          { id: 2, name: 'Test Area 2', slug: 'test-area-2' },
        ],
        userPermissions: [READ_PERMISSION],
      } as unknown as Parameters<typeof AreasPage>[1]['data']

      render(AreasPage, { data: mockData })

      expect(screen.getByText('Test Area 1')).toBeInTheDocument()
      expect(screen.getByText('Test Area 2')).toBeInTheDocument()
    })

    it('should show "No areas yet" message when areas array is empty', () => {
      const mockData = {
        areas: [],
        userPermissions: [READ_PERMISSION],
      } as unknown as Parameters<typeof AreasPage>[1]['data']

      render(AreasPage, { data: mockData })

      expect(screen.getByText('No areas yet')).toBeInTheDocument()
    })
  })
})
