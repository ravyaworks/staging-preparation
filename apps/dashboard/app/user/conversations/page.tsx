'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Eye, Trash2, MessageSquare } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent, Button, Input, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  EmptyState, ErrorState, Skeleton, Dialog, Select,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate } from '@/lib/utils'

const mockConversations = [
  { id: '1', title: 'Product onboarding flow', status: 'active', lastMessage: 'Can you help me understand the onboarding steps?', model: 'GPT-4', updatedAt: '2026-07-08T10:30:00' },
  { id: '2', title: 'Customer support ticket #4821', status: 'active', lastMessage: 'The issue has been resolved, thank you!', model: 'GPT-3.5', updatedAt: '2026-07-08T09:15:00' },
  { id: '3', title: 'API integration discussion', status: 'archived', lastMessage: 'Let me check the API docs for that endpoint', model: 'Claude-3', updatedAt: '2026-07-07T16:45:00' },
  { id: '4', title: 'Feature request: dark mode', status: 'active', lastMessage: 'We are considering adding dark mode support', model: 'GPT-4', updatedAt: '2026-07-07T14:20:00' },
  { id: '5', title: 'Bug report: login timeout', status: 'resolved', lastMessage: 'Fixed the session timeout issue in v2.1', model: 'GPT-4', updatedAt: '2026-07-06T11:00:00' },
  { id: '6', title: 'Data analysis pipeline', status: 'draft', lastMessage: 'What format should the output be in?', model: 'Claude-3', updatedAt: '2026-07-05T08:30:00' },
  { id: '7', title: 'Quarterly review preparation', status: 'active', lastMessage: 'Here are the Q2 metrics you requested', model: 'GPT-4', updatedAt: '2026-07-04T15:10:00' },
  { id: '8', title: 'User feedback analysis', status: 'archived', lastMessage: 'Summary of feedback from the last survey', model: 'GPT-3.5', updatedAt: '2026-07-03T12:00:00' },
]

type PageState = 'loading' | 'error' | 'loaded'

const mockStatuses = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'draft', label: 'Draft' },
]

export default function UserConversationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pageState, setPageState] = useState<PageState>('loaded')
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [conversations, setConversations] = useState(mockConversations)

  const filtered = useMemo(
    () => conversations.filter((c) => {
      const matchesSearch = !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || c.status === statusFilter
      const convDate = new Date(c.updatedAt)
      const matchesDateFrom = !dateFrom || convDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || convDate <= new Date(dateTo + 'T23:59:59')
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
    }),
    [conversations, search, statusFilter, dateFrom, dateTo]
  )

  const handleDelete = () => {
    if (deleteId) {
      setConversations((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
    }
  }

  if (pageState === 'loading') {
    return (
      <>
        <PageHeader title="Conversations" />
        <div className="p-6 space-y-4">
          <Skeleton variant="rectangular" width="100%" height={40} />
          <Card>
            <CardContent className="p-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="15%" />
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
        <PageHeader title="Conversations" />
        <div className="p-6">
          <ErrorState
            title="Failed to load conversations"
            description={error ?? 'An unexpected error occurred'}
            onRetry={() => { setPageState('loaded'); setError(null) }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Conversations" description="Manage your conversations">
        <Button variant="primary" asChild>
          <Link href="/user/conversations/new">
            <MessageSquare className="h-4 w-4" />
            New Conversation
          </Link>
        </Button>
      </PageHeader>

      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>All Conversations</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Select
                options={mockStatuses}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
                aria-label="From date"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
                aria-label="To date"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title={search ? 'No conversations found' : 'No conversations yet'}
                description={search ? 'Try adjusting your search terms' : 'Create your first conversation to get started'}
                action={
                  !search ? (
                    <Button variant="primary" asChild>
                      <Link href="/user/conversations/new">New Conversation</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/user/conversations/${conv.id}`} className="hover:text-blue-600 transition-colors">
                          {conv.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          conv.status === 'active' ? 'success' :
                          conv.status === 'resolved' ? 'info' :
                          conv.status === 'archived' ? 'default' :
                          'warning'
                        }>
                          {conv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="truncate block">{conv.lastMessage}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">{conv.model}</span>
                      </TableCell>
                      <TableCell>{formatDate(conv.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/user/conversations/${conv.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(conv.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      />
    </>
  )
}
