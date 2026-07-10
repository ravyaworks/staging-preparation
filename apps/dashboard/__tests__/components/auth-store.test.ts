import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('zustand/middleware', async (importOriginal) => {
  const mod = await importOriginal<typeof import('zustand/middleware')>()
  return { ...mod, persist: (config: any) => config }
})

import { useAuthStore } from '@/lib/auth-store'
import type { User } from '@/lib/auth-store'

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'super_admin',
  tenantId: 'tenant-1',
  permissions: ['read', 'write'],
  ...overrides,
})

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      isTenantAdmin: false,
    })
  })

  it('starts with null user', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.isTenantAdmin).toBe(false)
  })

  it('login sets user and tokens', () => {
    const user = mockUser()
    useAuthStore.getState().login(user, 'access-token', 'refresh-token')
    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.accessToken).toBe('access-token')
    expect(state.refreshToken).toBe('refresh-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('logout clears user and tokens', () => {
    useAuthStore.getState().login(mockUser(), 'token', 'refresh')
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.isTenantAdmin).toBe(false)
  })

  it('updateUser merges partial updates', () => {
    useAuthStore.getState().login(mockUser(), 'token', 'refresh')
    useAuthStore.getState().updateUser({ name: 'Updated Name', email: 'updated@test.com' })
    const state = useAuthStore.getState()
    expect(state.user?.name).toBe('Updated Name')
    expect(state.user?.email).toBe('updated@test.com')
    expect(state.user?.role).toBe('super_admin')
  })

  it('updateUser does nothing when user is null', () => {
    useAuthStore.getState().updateUser({ name: 'New' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setUser sets user and marks authenticated', () => {
    const user = mockUser()
    useAuthStore.getState().setUser(user)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })

  it('setTokens updates tokens only', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-access')
    expect(state.refreshToken).toBe('new-refresh')
    expect(state.user).toBeNull()
  })

  it('isAdmin returns true for super_admin', () => {
    useAuthStore.getState().login(mockUser({ role: 'super_admin' }), 't', 'r')
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('isAdmin returns true for admin', () => {
    useAuthStore.getState().login(mockUser({ role: 'admin' }), 't', 'r')
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('isAdmin returns false for tenant_admin', () => {
    useAuthStore.getState().login(mockUser({ role: 'tenant_admin' }), 't', 'r')
    expect(useAuthStore.getState().isAdmin).toBe(false)
  })

  it('isAdmin returns false for user', () => {
    useAuthStore.getState().login(mockUser({ role: 'user' }), 't', 'r')
    expect(useAuthStore.getState().isAdmin).toBe(false)
  })

  it('isTenantAdmin returns true for tenant_admin', () => {
    useAuthStore.getState().login(mockUser({ role: 'tenant_admin' }), 't', 'r')
    expect(useAuthStore.getState().isTenantAdmin).toBe(true)
  })

  it('isTenantAdmin returns false for other roles', () => {
    useAuthStore.getState().login(mockUser({ role: 'admin' }), 't', 'r')
    expect(useAuthStore.getState().isTenantAdmin).toBe(false)
  })
})
