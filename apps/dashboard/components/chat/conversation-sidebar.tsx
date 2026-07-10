'use client'

import { cn, formatDate } from '@/lib/utils'
import { Button, Dialog } from '@conversation-platform/ui'
import {
  Search,
  Plus,
  Trash2,
  MessageSquare,
  X,
  PanelLeft,
} from 'lucide-react'
import { useState, useMemo } from 'react'

interface ConversationSummary {
  id: string
  title: string
  lastMessage?: string
  updatedAt: Date
  model: string
  messageCount: number
}

interface ConversationSidebarProps {
  conversations: ConversationSummary[]
  currentConversationId?: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

const mockConversations: ConversationSummary[] = [
  {
    id: 'conv-1',
    title: 'Building a React component library',
    lastMessage: 'Let me break down the architecture for you...',
    updatedAt: new Date('2026-07-08T10:30:00'),
    model: 'GPT-4o',
    messageCount: 12,
  },
  {
    id: 'conv-2',
    title: 'API design best practices',
    lastMessage: 'RESTful APIs should follow these conventions...',
    updatedAt: new Date('2026-07-07T15:45:00'),
    model: 'Claude 3.5',
    messageCount: 8,
  },
  {
    id: 'conv-3',
    title: 'Database schema optimization',
    lastMessage: 'For your use case, I recommend indexing...',
    updatedAt: new Date('2026-07-06T09:15:00'),
    model: 'GPT-4o',
    messageCount: 15,
  },
  {
    id: 'conv-4',
    title: 'Deployment strategy discussion',
    lastMessage: 'A blue-green deployment would minimize downtime...',
    updatedAt: new Date('2026-07-05T14:20:00'),
    model: 'Claude 3.5',
    messageCount: 6,
  },
  {
    id: 'conv-5',
    title: 'Code review: authentication flow',
    lastMessage: 'The JWT implementation looks good, but...',
    updatedAt: new Date('2026-07-04T11:00:00'),
    model: 'GPT-4o',
    messageCount: 22,
  },
  {
    id: 'conv-6',
    title: 'Performance benchmarking setup',
    lastMessage: 'Here are the key metrics we should track...',
    updatedAt: new Date('2026-07-03T16:30:00'),
    model: 'GPT-4o',
    messageCount: 10,
  },
  {
    id: 'conv-7',
    title: 'UI/UX review for dashboard',
    lastMessage: 'The navigation could be improved by...',
    updatedAt: new Date('2026-07-02T08:00:00'),
    model: 'Claude 3.5',
    messageCount: 18,
  },
]

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
  }
  if (days === 1) { return 'Yesterday' }
  if (days < 7) { return `${days} days ago` }
  return formatDate(date)
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Delete conversation"
      description={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    />
  )
}

export function ConversationSidebar({
  conversations = mockConversations,
  currentConversationId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
  className,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null)

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) { return conversations }
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  const handleDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <aside
        className={cn(
          'flex flex-col border-r bg-background transition-all duration-300 overflow-hidden',
          isOpen ? 'w-72' : 'w-0 sm:w-0',
          className
        )}
      >
        <div className="flex h-full w-72 flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Conversations</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onNew} title="New conversation">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle} title="Close sidebar">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-b px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border bg-muted/30 py-1.5 pl-8 pr-8 text-xs outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/50">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex cursor-pointer flex-col rounded-lg px-3 py-2.5 transition-colors',
                      conv.id === currentConversationId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => onSelect(conv.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          'truncate text-sm font-medium',
                          conv.id === currentConversationId && 'text-primary'
                        )}
                      >
                        {conv.title}
                      </h3>
                      <span className="shrink-0 text-[10px] text-muted-foreground/50">
                        {formatRelativeDate(conv.updatedAt)}
                      </span>
                    </div>

                    {conv.lastMessage && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground/60">
                        {conv.lastMessage}
                      </p>
                    )}

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/40">{conv.model}</span>
                      <span className="text-[10px] text-muted-foreground/30">&middot;</span>
                      <span className="text-[10px] text-muted-foreground/40">
                        {conv.messageCount} messages
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(conv)
                      }}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-muted-foreground/30 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onNew}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New conversation
            </Button>
          </div>
        </div>
      </aside>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.title ?? ''}
      />
    </>
  )
}
