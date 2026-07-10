'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/lib/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {return}
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolved = prefersDark ? 'dark' : 'light'
      root.classList.add(resolved)
      root.setAttribute('data-theme', resolved)
    } else {
      root.classList.add(theme)
      root.setAttribute('data-theme', theme)
    }
  }, [theme, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
