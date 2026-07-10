'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'super_admin' | 'admin' | 'tenant_admin' | 'user'
  tenantId: string
  permissions: string[]
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isTenantAdmin: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      isTenantAdmin: false,

      setTokens: (accessToken: string, refreshToken: string) =>
        set({ accessToken, refreshToken }),

      setUser: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'super_admin' || user.role === 'admin',
          isTenantAdmin: user.role === 'tenant_admin',
        }),

      login: (user: User, accessToken: string, refreshToken: string) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isAdmin: user.role === 'super_admin' || user.role === 'admin',
          isTenantAdmin: user.role === 'tenant_admin',
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          isTenantAdmin: false,
        }),

      updateUser: (updates: Partial<User>) =>
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...updates } : null
          return {
            user: updatedUser,
            isAdmin: updatedUser
              ? updatedUser.role === 'super_admin' || updatedUser.role === 'admin'
              : false,
            isTenantAdmin: updatedUser ? updatedUser.role === 'tenant_admin' : false,
          }
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
