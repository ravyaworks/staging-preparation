'use client'

import { useState } from 'react'
import {
  Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react'
import {
  Card, CardContent, Button, EmptyState, ErrorState, Skeleton,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  read: boolean
  createdAt: string
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'info', title: 'New message received', message: 'You have a new message in Product onboarding flow', read: false, createdAt: '2026-07-08T10:35:00' },
  { id: '2', type: 'success', title: 'Conversation resolved', message: 'Customer support ticket #4821 has been marked as resolved', read: false, createdAt: '2026-07-08T09:30:00' },
  { id: '3', type: 'warning', title: 'Rate limit approaching', message: 'You have used 85% of your daily API quota', read: true, createdAt: '2026-07-08T08:00:00' },
  { id: '4', type: 'error', title: 'Integration failure', message: 'Slack integration disconnected due to token expiry', read: false, createdAt: '2026-07-07T22:15:00' },
  { id: '5', type: 'info', title: 'Weekly report ready', message: 'Your weekly conversation summary is available', read: true, createdAt: '2026-07-07T09:00:00' },
  { id: '6', type: 'success', title: 'Export completed', message: 'Your data export is ready for download', read: true, createdAt: '2026-07-06T14:30:00' },
  { id: '7', type: 'warning', title: 'Storage warning', message: 'You are using 90% of your allocated storage', read: false, createdAt: '2026-07-06T11:00:00' },
]

const typeConfig = {
  info: { icon: Info, bg: 'bg-blue-100', fg: 'text-blue-600' },
  success: { icon: CheckCircle, bg: 'bg-green-100', fg: 'text-green-600' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-100', fg: 'text-yellow-600' },
  error: { icon: XCircle, bg: 'bg-red-100', fg: 'text-red-600' },
} as const

type PageState = 'loading' | 'error' | 'loaded'

export default function UserNotificationsPage() {
  const [pageState, setPageState] = useState<PageState>('loaded')
  const [error] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  if (pageState === 'loading') {
    return (
      <>
        <PageHeader title="Notifications" />
        <div className="p-6">
          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-4">
                  <Skeleton variant="circular" width={32} height={32} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="30%" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (pageState === 'error') {
    return (
      <>
        <PageHeader title="Notifications" />
        <div className="p-6">
          <ErrorState
            title="Failed to load notifications"
            description={error ?? 'An unexpected error occurred'}
            onRetry={() => { setPageState('loaded') }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Notifications" description={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : undefined}>
        {notifications.length > 0 && (
          <>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </>
        )}
      </PageHeader>

      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-8 w-8" />}
                title="No notifications"
                description="You are all caught up! New notifications will appear here."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notif) => {
                  const TypeIcon = typeConfig[notif.type].icon
                  return (
                    <li
                      key={notif.id}
                      className={`px-6 py-4 transition-colors ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`rounded-full p-2 flex-shrink-0 ${typeConfig[notif.type].bg}`}>
                          <TypeIcon className={`h-4 w-4 ${typeConfig[notif.type].fg}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                              )}
                            </div>
                            {!notif.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">{formatDate(notif.createdAt)}</span>
                            {!notif.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto py-0.5 px-2"
                                onClick={() => markAsRead(notif.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
