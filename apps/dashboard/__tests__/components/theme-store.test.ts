import { describe, it, expect } from 'vitest'
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function createThemeStore() {
  return create<ThemeState>()((set) => ({
    theme: 'system',
    setTheme: (theme: Theme) => set({ theme }),
  }))
}

describe('theme store', () => {
  it('defaults to system', () => {
    const store = createThemeStore()
    expect(store.getState().theme).toBe('system')
  })

  it('setTheme updates theme to dark', () => {
    const store = createThemeStore()
    store.getState().setTheme('dark')
    expect(store.getState().theme).toBe('dark')
  })

  it('setTheme updates theme to light', () => {
    const store = createThemeStore()
    store.getState().setTheme('light')
    expect(store.getState().theme).toBe('light')
  })

  it('setTheme updates theme to system', () => {
    const store = createThemeStore()
    store.getState().setTheme('dark')
    store.getState().setTheme('system')
    expect(store.getState().theme).toBe('system')
  })
})
