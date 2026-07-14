'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  GitBranch,
  BarChart3,
  Settings,
  Users,
  Building2,
  Shield,
  Puzzle,
  FileText,
  Code,
  ChevronLeft,
  ChevronRight,
  Bell,
  LifeBuoy,
  Send,
  BarChart,
  Activity,
  Database,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: string[]
}

const adminNavItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Roles', href: '/admin/roles', icon: Shield },
  { label: 'API Keys', href: '/admin/api-keys', icon: Code },
  { label: 'Channels', href: '/admin/channels', icon: Activity },
  { label: 'Feature Flags', href: '/admin/feature-flags', icon: Puzzle },
  { label: 'Configuration', href: '/admin/configuration', icon: Settings },
  { label: 'Webhooks', href: '/admin/webhooks', icon: Send },
  { label: 'Audit Log', href: '/admin/audit', icon: FileText },
  { label: 'Backups', href: '/admin/backups', icon: Database },
  { label: 'Maintenance', href: '/admin/maintenance', icon: Shield },
  { label: 'System Health', href: '/admin/health', icon: Activity },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

const tenantNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/tenant', icon: LayoutDashboard },
  { label: 'Inbox', href: '/tenant/inbox', icon: MessageSquare },
  { label: 'Contacts', href: '/tenant/contacts', icon: Users },
  { label: 'Conversations', href: '/tenant/conversations', icon: MessageSquare },
  { label: 'Knowledge', href: '/tenant/knowledge', icon: BookOpen },
  { label: 'Workflows', href: '/tenant/workflows', icon: GitBranch },
  { label: 'Team', href: '/tenant/team', icon: Users },
  { label: 'Analytics', href: '/tenant/analytics', icon: BarChart },
  { label: 'Delivery', href: '/tenant/delivery', icon: Send },
  { label: 'Outreach', href: '/tenant/outreach', icon: Send },
  { label: 'Settings', href: '/tenant/settings', icon: Settings },
]

const userNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/user', icon: LayoutDashboard },
  { label: 'Conversations', href: '/user/conversations', icon: MessageSquare },
  { label: 'Notifications', href: '/user/notifications', icon: Bell },
  { label: 'Settings', href: '/user/settings', icon: Settings },
]

const bottomNavItems: NavItem[] = [
  { label: 'Widget Builder', href: '/widgets', icon: Puzzle },
  { label: 'Playground', href: '/playground', icon: Code },
  { label: 'Documentation', href: '/docs', icon: FileText },
  { label: 'Developer API', href: '/developer', icon: Code },
  { label: 'Help', href: '/help', icon: LifeBuoy },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [collapsed, setCollapsed] = useState(false)

  const getNavItems = (): NavItem[] => {
    if (!user) {return bottomNavItems}
    if (user.role === 'super_admin' || user.role === 'admin') {
      return [...adminNavItems, ...bottomNavItems]
    }
    if (user.role === 'tenant_admin') {
      return [...tenantNavItems, ...bottomNavItems]
    }
    return [...userNavItems, ...bottomNavItems]
  }

  const navItems = getNavItems()

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm truncate">
              Conversation Platform
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
