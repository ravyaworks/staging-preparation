'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, Filter, RefreshCw, Phone, Mail, MoreHorizontal } from 'lucide-react'
import { Button, Card, CardContent, Input, Badge, Skeleton, ErrorState, EmptyState, Select, Dropdown } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate, truncate } from '@/lib/utils'

interface Conversation {
  id: string
  status: string
  priority: string
  channel: string
  lastMessagePreview: string | null
  lastMessageAt: string | null
  messageCount: number
  contact: { id: string; name: string | null; phone: string | null; avatarUrl: string | null } | null
  assignedTo: { id: string; firstName: string; lastName: string } | null
}

const mockConversations: Conversation[] = [
  { id: '1', status: 'active', priority: 'high', channel: 'whatsapp', lastMessagePreview: 'Hi, I am interested in your premium plan pricing', lastMessageAt: '2026-07-13T10:30:00Z', messageCount: 12, contact: { id: 'c1', name: 'John Doe', phone: '+1234567890', avatarUrl: null }, assignedTo: null },
  { id: '2', status: 'active', priority: 'normal', channel: 'whatsapp', lastMessagePreview: 'Can you help me with the API documentation?', lastMessageAt: '2026-07-13T09:15:00Z', messageCount: 8, contact: { id: 'c2', name: 'Sarah Johnson', phone: '+1987654321', avatarUrl: null }, assignedTo: { id: 'u1', firstName: 'Alex', lastName: 'Chen' } },
  { id: '3', status: 'waiting', priority: 'urgent', channel: 'whatsapp', lastMessagePreview: 'My account has been locked for 2 hours now!', lastMessageAt: '2026-07-12T22:00:00Z', messageCount: 5, contact: { id: 'c3', name: 'Mike Brown', phone: '+1555123456', avatarUrl: null }, assignedTo: null },
  { id: '4', status: 'active', priority: 'normal', channel: 'whatsapp', lastMessagePreview: 'Thanks for resolving the issue, but I have another question', lastMessageAt: '2026-07-12T16:45:00Z', messageCount: 23, contact: { id: 'c4', name: 'Emily Davis', phone: '+1777888999', avatarUrl: null }, assignedTo: { id: 'u2', firstName: 'Sam', lastName: 'Wilson' } },
  { id: '5', status: 'resolved', priority: 'low', channel: 'whatsapp', lastMessagePreview: 'The feature works perfectly now, thank you!', lastMessageAt: '2026-07-11T14:20:00Z', messageCount: 16, contact: { id: 'c5', name: 'David Lee', phone: '+1666555444', avatarUrl: null }, assignedTo: { id: 'u1', firstName: 'Alex', lastName: 'Chen' } },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const statusColor: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  waiting: 'warning',
  resolved: 'info',
  closed: 'default',
}

const priorityColor: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'default',
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setConversations(mockConversations)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      load()
      setRefreshing(false)
    }, 400)
  }

  const filtered = (conversations ?? []).filter((c) => {
    const matchesSearch = !search || 
      c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact?.phone?.includes(search) ||
      c.lastMessagePreview?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const unreadCount = (conversations ?? []).filter((c) => c.status === 'active' || c.status === 'waiting').length

  if (error) {
    return (
      <div>
        <PageHeader title="Inbox" description="Manage incoming messages" />
        <div className="p-6">
          <ErrorState title="Failed to load inbox" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Inbox" description="Manage incoming messages">
        <div className="flex items-center gap-2">
          <Badge variant="warning">{unreadCount} unread</Badge>
          <Button size="sm" variant="outline" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-1">
                      <Skeleton width="40%" />
                      <Skeleton width="70%" height={12} />
                    </div>
                    <Skeleton width={60} height={20} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title="No messages yet"
                description="Incoming messages from your channels will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages or contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground ml-auto">
                {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No conversations match your filters.
                  </CardContent>
                </Card>
              ) : (
                filtered.map((conv) => (
                  <Link key={conv.id} href={`/tenant/inbox/conversations/${conv.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            {conv.channel === 'whatsapp' ? (
                              <Phone className="h-4 w-4 text-primary" />
                            ) : conv.channel === 'email' ? (
                              <Mail className="h-4 w-4 text-primary" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {conv.contact?.name ?? conv.contact?.phone ?? 'Unknown'}
                              </span>
                              <Badge variant={priorityColor[conv.priority] || 'default'} className="text-[10px] px-1.5 py-0">
                                {conv.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ''}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {truncate(conv.lastMessagePreview ?? 'No messages yet', 80)}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant={statusColor[conv.status]} className="text-[10px] px-1.5 py-0">
                                {conv.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {conv.messageCount} msg
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {conv.channel}
                              </span>
                              {conv.assignedTo && (
                                <span className="text-xs text-muted-foreground">
                                  &middot; {conv.assignedTo.firstName} {conv.assignedTo.lastName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
