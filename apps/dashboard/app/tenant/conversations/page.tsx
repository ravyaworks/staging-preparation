'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Search,
  Trash2,
  Archive,
  MoreHorizontal,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Select,
  Dialog,
  Skeleton,
  EmptyState,
  ErrorState,
  Dropdown,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate, truncate } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  status: 'active' | 'pending' | 'resolved' | 'closed'
  messageCount: number
  model: string
  created: string
  lastActivity: string
  assignee: string
  selected?: boolean
}

const mockConversations: Conversation[] = [
  { id: '1', title: 'Product inquiry - pricing and plans', status: 'active', messageCount: 23, model: 'GPT-4o', created: '2026-07-05T10:30:00Z', lastActivity: '2026-07-08T10:30:00Z', assignee: 'You' },
  { id: '2', title: 'Technical support: API integration issues', status: 'active', messageCount: 45, model: 'Claude 3.5', created: '2026-07-04T09:15:00Z', lastActivity: '2026-07-08T09:15:00Z', assignee: 'Alex Chen' },
  { id: '3', title: 'Account cancellation request - urgent', status: 'pending', messageCount: 8, model: 'GPT-4o', created: '2026-07-07T22:00:00Z', lastActivity: '2026-07-07T22:00:00Z', assignee: 'Sam Wilson' },
  { id: '4', title: 'Feature request: dark mode support', status: 'resolved', messageCount: 16, model: 'Claude 3.5', created: '2026-07-01T16:45:00Z', lastActivity: '2026-07-07T16:45:00Z', assignee: 'Jordan Lee' },
  { id: '5', title: 'Billing discrepancy on invoice #1024', status: 'active', messageCount: 31, model: 'GPT-4o', created: '2026-07-03T14:20:00Z', lastActivity: '2026-07-07T14:20:00Z', assignee: 'You' },
  { id: '6', title: 'Onboarding: new user setup assistance', status: 'active', messageCount: 12, model: 'GPT-4o mini', created: '2026-07-06T11:00:00Z', lastActivity: '2026-07-07T11:00:00Z', assignee: 'Taylor Reed' },
  { id: '7', title: 'Complaint about service outage', status: 'resolved', messageCount: 27, model: 'Claude 3.5', created: '2026-07-02T08:30:00Z', lastActivity: '2026-07-06T08:30:00Z', assignee: 'Morgan Page' },
  { id: '8', title: 'Integration request: Salesforce connector', status: 'closed', messageCount: 19, model: 'GPT-4o', created: '2026-06-28T13:00:00Z', lastActivity: '2026-07-05T13:00:00Z', assignee: 'Casey Kim' },
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const statusColor: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  pending: 'warning',
  resolved: 'info',
  closed: 'default',
}

const assigneeOptions = [
  { value: '', label: 'All Assignees' },
  { value: 'You', label: 'You' },
  { value: 'Alex Chen', label: 'Alex Chen' },
  { value: 'Sam Wilson', label: 'Sam Wilson' },
  { value: 'Jordan Lee', label: 'Jordan Lee' },
  { value: 'Taylor Reed', label: 'Taylor Reed' },
  { value: 'Morgan Page', label: 'Morgan Page' },
]

function ConversationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton width={280} height={38} />
        <Skeleton width={160} height={38} />
        <Skeleton width={160} height={38} />
        <Skeleton width={100} height={38} className="ml-auto" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton variant="rectangular" width={16} height={16} />
                <div className="flex-1 space-y-1">
                  <Skeleton width="50%" />
                  <Skeleton width="30%" height={12} />
                </div>
                <Skeleton width={60} height={20} />
                <Skeleton width={80} height={20} />
                <Skeleton width={120} />
                <Skeleton width={24} height={24} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteDialog({
  open,
  onClose,
  onConfirm,
  count,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  count: number
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete conversations"
      description={`Are you sure you want to delete ${count} conversation${count > 1 ? 's' : ''}? This action cannot be undone.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </>
      }
    />
  )
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selection, setSelection] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setConversations(mockConversations)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = (conversations ?? []).filter((c) => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || c.status === statusFilter
    const matchesAssignee = !assigneeFilter || c.assignee === assigneeFilter
    const convDate = new Date(c.created)
    const matchesDateFrom = !dateFrom || convDate >= new Date(dateFrom)
    const matchesDateTo = !dateTo || convDate <= new Date(dateTo + 'T23:59:59')
    return matchesSearch && matchesStatus && matchesAssignee && matchesDateFrom && matchesDateTo
  })

  const toggleSelect = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {next.delete(id)}
      else {next.add(id)}
      return next
    })
  }

  const toggleAll = () => {
    if (selection.size === filtered.length) {
      setSelection(new Set())
    } else {
      setSelection(new Set(filtered.map((c) => c.id)))
    }
  }

  const handleArchive = () => {
    setConversations((prev) => (prev ?? []).filter((c) => !selection.has(c.id)))
    setSelection(new Set())
  }

  const handleDelete = () => {
    setConversations((prev) => (prev ?? []).filter((c) => !selection.has(c.id)))
    setSelection(new Set())
    setShowDeleteDialog(false)
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Conversations" description="Manage all conversations" />
        <div className="p-6">
          <ErrorState title="Failed to load conversations" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Conversations" description="Manage all conversations">
        <Link href="/tenant/conversations/new">
          <Button size="sm">
            <MessageSquare className="mr-1.5 h-4 w-4" />
            New Conversation
          </Button>
        </Link>
      </PageHeader>

      <div className="p-6">
        {loading ? <ConversationsSkeleton /> : !conversations || conversations.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<MessageSquare className="h-12 w-12" />}
                title="No conversations yet"
                description="Start your first conversation to see it here."
                action={
                  <Link href="/tenant/conversations/new">
                    <Button>
                      <MessageSquare className="mr-1.5 h-4 w-4" />
                      New Conversation
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              />
              <Select
                options={assigneeOptions}
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-44"
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
              {selection.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">{selection.size} selected</span>
                  <Button variant="outline" size="sm" onClick={handleArchive}>
                    <Archive className="mr-1.5 h-4 w-4" />
                    Archive
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selection.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="rounded border-border"
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20">Messages</TableHead>
                      <TableHead className="w-28">Model</TableHead>
                      <TableHead className="w-36">Created</TableHead>
                      <TableHead className="w-36">Last Activity</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No conversations match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((conv) => (
                        <TableRow key={conv.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selection.has(conv.id)}
                              onChange={() => toggleSelect(conv.id)}
                              className="rounded border-border"
                            />
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/tenant/conversations/${conv.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {truncate(conv.title, 50)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor[conv.status]}>{conv.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{conv.messageCount}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{conv.model}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDate(conv.created)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDate(conv.lastActivity)}</TableCell>
                          <TableCell>
                            <Dropdown
                              trigger={<MoreHorizontal className="h-4 w-4 text-muted-foreground" />}
                              align="end"
                              items={[
                                { label: 'View details', onClick: () => {} },
                                { label: 'Archive', onClick: () => {} },
                                { label: 'Delete', onClick: () => {}, variant: 'danger' },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        count={selection.size}
      />
    </div>
  )
}
