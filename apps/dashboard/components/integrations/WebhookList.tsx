'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Toggle,
  Dialog,
  Input,
  EmptyState,
} from '@conversation-platform/ui'
import { Webhook, Copy, Check, Key, Plus, Trash2, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface WebhookEntry {
  id: string
  url: string
  events: string[]
  enabled: boolean
  lastTriggered: string | null
  secret: string
  lastDeliveryStatus: 'success' | 'failed' | null
}

interface WebhookListProps {
  webhooks: WebhookEntry[]
  onToggle: (id: string) => void
  onCreate: (webhook: { url: string; events: string[] }) => void
  onDelete: (id: string) => void
  onRegenerateSecret: (id: string) => void
}

const eventOptions = [
  { value: 'message.created', label: 'Message Created' },
  { value: 'message.updated', label: 'Message Updated' },
  { value: 'conversation.created', label: 'Conversation Created' },
  { value: 'conversation.updated', label: 'Conversation Updated' },
  { value: 'conversation.resolved', label: 'Conversation Resolved' },
  { value: 'contact.created', label: 'Contact Created' },
  { value: 'contact.updated', label: 'Contact Updated' },
]

export function WebhookList({ webhooks, onToggle, onCreate, onDelete, onRegenerateSecret }: WebhookListProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [newEvents, setNewEvents] = useState<string[]>([])

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard not available
    }
  }

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const handleCreate = () => {
    if (!newUrl) { return }
    onCreate({ url: newUrl, events: newEvents })
    setNewUrl('')
    setNewEvents([])
    setShowCreate(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks</h3>
          <p className="text-sm text-muted-foreground">Manage webhook endpoints for real-time events.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Webhook className="h-12 w-12" />}
              title="No webhooks yet"
              description="Create your first webhook endpoint to receive real-time events."
            />
          </CardContent>
        </Card>
      ) : (
        webhooks.map((wh) => (
          <Card key={wh.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{wh.url}</CardTitle>
                  <CardDescription>
                    {wh.events.join(', ')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wh.lastDeliveryStatus && (
                    <Badge variant={wh.lastDeliveryStatus === 'success' ? 'success' : 'danger'} className="text-[10px]">
                      {wh.lastDeliveryStatus === 'success' ? 'Delivered' : 'Failed'}
                    </Badge>
                  )}
                  <Toggle
                    checked={wh.enabled}
                    onChange={() => onToggle(wh.id)}
                    aria-label={`${wh.enabled ? 'Disable' : 'Enable'} webhook`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(wh.id)} aria-label="Delete webhook">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">
                  {wh.secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(wh.secret, `secret-${wh.id}`)}
                  aria-label="Copy webhook secret"
                >
                  {copiedId === `secret-${wh.id}`
                    ? <Check className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerateSecret(wh.id)}
                  aria-label="Regenerate webhook secret"
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>

              {wh.lastTriggered && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Last triggered: {formatDate(wh.lastTriggered)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Webhook"
        description="Set up a new webhook endpoint to receive events."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newUrl}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Endpoint URL"
            placeholder="https://example.com/webhook"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Events</label>
            <div className="space-y-2">
              {eventOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newEvents.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                    className="rounded border-border"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) { onDelete(deleteId) }
                setDeleteId(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  )
}
