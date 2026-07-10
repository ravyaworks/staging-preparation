'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Bell,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Bot,
  Settings,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { useAuthStore } from '@/lib/auth-store'
import { formatDate } from '@/lib/utils'

const mockStats = {
  conversationsToday: 12,
  totalConversations: 248,
  unreadNotifications: 5,
}

const mockRecentConversations = [
  { id: '1', title: 'Product onboarding flow', updatedAt: new Date('2026-07-08T10:30:00'), status: 'active' },
  { id: '2', title: 'Customer support ticket #4821', updatedAt: new Date('2026-07-08T09:15:00'), status: 'active' },
  { id: '3', title: 'API integration discussion', updatedAt: new Date('2026-07-07T16:45:00'), status: 'archived' },
  { id: '4', title: 'Feature request: dark mode', updatedAt: new Date('2026-07-07T14:20:00'), status: 'active' },
  { id: '5', title: 'Bug report: login timeout', updatedAt: new Date('2026-07-06T11:00:00'), status: 'resolved' },
]

const mockNotifications = [
  { id: '1', type: 'info', title: 'New message received', message: 'You have a new message in Product onboarding flow', read: false, createdAt: '2026-07-08T10:35:00' },
  { id: '2', type: 'success', title: 'Conversation resolved', message: 'Customer support ticket #4821 has been marked as resolved', read: false, createdAt: '2026-07-08T09:30:00' },
  { id: '3', type: 'warning', title: 'Rate limit approaching', message: 'You have used 85% of your daily API quota', read: true, createdAt: '2026-07-08T08:00:00' },
  { id: '4', type: 'error', title: 'Integration failure', message: 'Slack integration disconnected due to token expiry', read: false, createdAt: '2026-07-07T22:15:00' },
]

type DashboardState = 'loading' | 'error' | 'loaded'

export default function UserDashboardPage() {
  const { user } = useAuthStore()
  const [state, setState] = useState<DashboardState>('loaded')
  const [error] = useState<string | null>(null)

  if (state === 'loading') {
    return (
      <>
        <PageHeader title="Dashboard" description="Welcome back" />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={32} />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><Skeleton variant="text" width="40%" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" width="100%" />
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (state === 'error') {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-red-100 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
            {error && <p className="mt-2 text-sm text-gray-500 max-w-sm">{error}</p>}
            <Button variant="outline" className="mt-6" onClick={() => setState('loaded')}>
              Retry
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${user?.name ?? 'User'}`}>
        <Button variant="primary" asChild>
          <Link href="/user/conversations">
            <MessageSquare className="h-4 w-4" />
            View Conversations
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Conversations Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{mockStats.conversationsToday}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+12% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Conversations</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{mockStats.totalConversations}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unread Notifications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{mockStats.unreadNotifications}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                <Bell className="h-4 w-4" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Conversations</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">Your latest conversations</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/user/conversations">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {mockRecentConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No conversations yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {mockRecentConversations.map((conv) => (
                    <li key={conv.id}>
                      <Link
                        href={`/user/conversations/${conv.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-full bg-gray-100 p-2 flex-shrink-0">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.title}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(conv.updatedAt)}</p>
                          </div>
                        </div>
                        <Badge variant={conv.status === 'active' ? 'success' : conv.status === 'resolved' ? 'info' : 'default'}>
                          {conv.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Notifications</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">Latest updates and alerts</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/user/notifications">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {mockNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {mockNotifications.map((notif) => (
                    <li key={notif.id} className={`px-6 py-3 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-1.5 mt-0.5 flex-shrink-0 ${
                          notif.type === 'success' ? 'bg-green-100' :
                          notif.type === 'warning' ? 'bg-yellow-100' :
                          notif.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <div className={`h-3 w-3 rounded-full ${
                            notif.type === 'success' ? 'bg-green-500' :
                            notif.type === 'warning' ? 'bg-yellow-500' :
                            notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                            {!notif.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          {notif.message && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">Common tasks and shortcuts</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                <Link href="/user/conversations/new">
                  <Plus className="h-5 w-5 mr-3 text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium">New Conversation</p>
                    <p className="text-xs text-gray-500 font-normal">Start a new chat</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                <Link href="/user/notifications">
                  <Bell className="h-5 w-5 mr-3 text-amber-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-gray-500 font-normal">View your alerts</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                <Link href="/user/settings">
                  <Settings className="h-5 w-5 mr-3 text-gray-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Settings</p>
                    <p className="text-xs text-gray-500 font-normal">Manage preferences</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                <Link href="/user/conversations">
                  <Bot className="h-5 w-5 mr-3 text-purple-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium">All Conversations</p>
                    <p className="text-xs text-gray-500 font-normal">Browse history</p>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
