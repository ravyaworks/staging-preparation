'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useNotificationsStore } from '@/lib/notifications-store'
import { useThemeStore } from '@/lib/theme-store'
import { Bell, Moon, Sun, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6" role="banner">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium text-muted-foreground">
          {user ? (
            <span>
              Welcome back, <span className="text-foreground font-semibold">{user.name}</span>
            </span>
          ) : (
            <span>Dashboard</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-accent transition-colors"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-fade-in z-50" role="menu" onKeyDown={(e) => { if (e.key === 'Escape') { setUserMenuOpen(false) } }}>
                <div className="border-b px-2 py-1.5 mb-1">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Link
                  href="/user/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/user"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                  role="menuitem"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
