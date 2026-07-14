'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import { Webhook, Plus, Edit3, Trash2, Play, RotateCcw, Search } from 'lucide-react'

interface WebhookItem {
  id: string; name: string; url: string; events: string[]; isActive: boolean; lastTriggeredAt: string | null; createdAt: string
}

const mockWebhooks: WebhookItem[] = [
  { id: '1', name: 'Message Webhook', url: 'https://api.example.com/webhooks/messages', events: ['message.created', 'message.updated'], isActive: true, lastTriggeredAt: '2024-07-06T14:30:00Z', createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Conversation Events', url: 'https://hooks.example.com/conversations', events: ['conversation.created', 'conversation.updated', 'conversation.closed'], isActive: true, lastTriggeredAt: '2024-07-06T12:15:00Z', createdAt: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Delivery Notifications', url: 'https://api.example.com/delivery', events: ['delivery.sent', 'delivery.delivered', 'delivery.failed'], isActive: false, lastTriggeredAt: '2024-06-01T11:00:00Z', createdAt: '2024-03-10T08:15:00Z' },
]

const allEventOptions = [
  'message.created', 'message.updated', 'message.deleted',
  'conversation.created', 'conversation.updated', 'conversation.closed',
  'campaign.started', 'campaign.completed', 'campaign.failed',
  'delivery.sent', 'delivery.delivered', 'delivery.failed',
  'contact.created', 'contact.updated',
  'user.login', 'user.logout',
]

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<WebhookItem | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => { setWebhooks(mockWebhooks); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return webhooks.filter(w => w.name.toLowerCase().includes(q) || w.url.toLowerCase().includes(q))
  }, [webhooks, search])

  const toggleEvent = (event: string) => {
    setFormEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event])
  }

  const openCreate = () => { setEditing(null); setFormName(''); setFormUrl(''); setFormEvents([]); setDialogOpen(true) }
  const openEdit = (w: WebhookItem) => { setEditing(w); setFormName(w.name); setFormUrl(w.url); setFormEvents([...w.events]); setDialogOpen(true) }

  const handleSave = () => {
    if (!formName.trim() || !formUrl.trim()) return
    if (editing) {
      setWebhooks(prev => prev.map(w => w.id === editing.id ? { ...w, name: formName.trim(), url: formUrl.trim(), events: formEvents } : w))
    } else {
      setWebhooks(prev => [{ id: generateId(), name: formName.trim(), url: formUrl.trim(), events: formEvents, isActive: true, lastTriggeredAt: null, createdAt: new Date().toISOString() }, ...prev])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => { if (deleteConfirm) { setWebhooks(prev => prev.filter(w => w.id !== deleteConfirm.id)); setDeleteConfirm(null) } }

  const handleTest = (id: string) => {
    setTestResult({ id, success: Math.random() > 0.3, message: Math.random() > 0.3 ? 'Webhook delivered successfully (200)' : 'Webhook timed out after 10s' })
    setTimeout(() => setTestResult(null), 4000)
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Webhooks" description="Manage outbound webhook endpoints">
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Webhook</Button>
      </PageHeader>
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search webhooks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={80} />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Webhook className="h-12 w-12" />} title={search ? 'No webhooks match your search' : 'No webhooks configured'} description={search ? 'Try a different search' : 'Create a webhook to receive events'} action={!search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Webhook</Button>} /></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(wh => (
              <Card key={wh.id} className="p-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{wh.name}</span>
                        <Badge variant={wh.isActive ? 'success' : 'danger'}>{wh.isActive ? 'Active' : 'Disabled'}</Badge>
                      </div>
                      <code className="text-xs text-gray-500 mt-0.5 block truncate">{wh.url}</code>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {wh.events.map(e => <Badge key={e} variant="default" className="text-xs">{e}</Badge>)}
                      </div>
                      {wh.lastTriggeredAt && <p className="text-xs text-gray-400 mt-1">Last triggered: {formatDate(wh.lastTriggeredAt)}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => handleTest(wh.id)} title="Test Webhook"><Play className="h-3.5 w-3.5 text-green-500" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(wh)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(wh)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                  {testResult?.id === wh.id && (
                    <div className={`mt-2 p-2 rounded text-xs ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {testResult.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit Webhook' : 'Create Webhook'} description={editing ? 'Update webhook configuration.' : 'Register a new webhook endpoint.'} size="lg"
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim() || !formUrl.trim()}>{editing ? 'Save Changes' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. My Webhook" />
          <Input label="URL" value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://api.example.com/webhook" />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {allEventOptions.map(event => (
                <Button key={event} size="sm" variant={formEvents.includes(event) ? 'default' : 'outline'} onClick={() => toggleEvent(event)} className="text-xs">{event}</Button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Webhook" description={`Are you sure you want to delete "${deleteConfirm?.name}"?`} size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>} />
    </>
  )
}
