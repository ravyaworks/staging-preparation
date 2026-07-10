import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationsStore } from '@/lib/notifications-store'
import type { Notification } from '@/lib/notifications-store'

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: Date.now().toString(),
  type: 'info',
  title: 'Test Notification',
  message: 'This is a test',
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('notifications store', () => {
  beforeEach(() => {
    useNotificationsStore.setState({ notifications: [], unreadCount: 0 })
  })

  it('starts empty', () => {
    expect(useNotificationsStore.getState().notifications).toHaveLength(0)
  })

  it('addNotification prepends to the list', () => {
    const n1 = createNotification({ id: '1', title: 'First' })
    const n2 = createNotification({ id: '2', title: 'Second' })

    useNotificationsStore.getState().addNotification(n1)
    useNotificationsStore.getState().addNotification(n2)

    const notifications = useNotificationsStore.getState().notifications
    expect(notifications).toHaveLength(2)
    expect(notifications[0].id).toBe('2')
    expect(notifications[1].id).toBe('1')
  })

  it('markAsRead updates read status of specific notification', () => {
    const n = createNotification({ id: '1' })
    useNotificationsStore.getState().addNotification(n)
    useNotificationsStore.getState().markAsRead('1')
    expect(useNotificationsStore.getState().notifications[0].read).toBe(true)
  })

  it('markAsRead does not affect other notifications', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '2' }))
    useNotificationsStore.getState().markAsRead('1')
    const notifications = useNotificationsStore.getState().notifications
    expect(notifications.find((n) => n.id === '1')?.read).toBe(true)
    expect(notifications.find((n) => n.id === '2')?.read).toBe(false)
  })

  it('markAllAsRead marks all notifications as read', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '2' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '3' }))
    useNotificationsStore.getState().markAllAsRead()
    expect(useNotificationsStore.getState().notifications.every((n) => n.read)).toBe(true)
  })

  it('removeNotification removes by id', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '2' }))
    useNotificationsStore.getState().removeNotification('1')
    const notifications = useNotificationsStore.getState().notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0].id).toBe('2')
  })

  it('removeNotification does nothing for non-existent id', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().removeNotification('non-existent')
    expect(useNotificationsStore.getState().notifications).toHaveLength(1)
  })

  it('clearAll empties the notifications array', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '2' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '3' }))
    useNotificationsStore.getState().clearAll()
    expect(useNotificationsStore.getState().notifications).toHaveLength(0)
  })

  it('unreadCount starts at 0', () => {
    expect(useNotificationsStore.getState().unreadCount).toBe(0)
  })

  it('unreadCount increases with new notifications', () => {
    useNotificationsStore.getState().addNotification(createNotification())
    expect(useNotificationsStore.getState().unreadCount).toBe(1)
    useNotificationsStore.getState().addNotification(createNotification())
    expect(useNotificationsStore.getState().unreadCount).toBe(2)
  })

  it('unreadCount decreases when marking as read', () => {
    useNotificationsStore.getState().addNotification(createNotification({ id: '1' }))
    useNotificationsStore.getState().addNotification(createNotification({ id: '2' }))
    expect(useNotificationsStore.getState().unreadCount).toBe(2)
    useNotificationsStore.getState().markAsRead('1')
    expect(useNotificationsStore.getState().unreadCount).toBe(1)
  })
})
