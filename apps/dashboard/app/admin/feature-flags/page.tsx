'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Toggle, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import { Flag, Plus, Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface FeatureFlag {
  id: string; key: string; name: string; description: string; enabled: boolean; isGlobal: boolean; updatedAt: string
}

const mockFlags: FeatureFlag[] = [
  { id: '1', key: 'ai-powered-replies', name: 'AI Powered Replies', description: 'Enable AI-generated reply suggestions', enabled: true, isGlobal: true, updatedAt: '2024-07-01T10:00:00Z' },
  { id: '2', key: 'advanced-analytics', name: 'Advanced Analytics', description: 'Enable advanced analytics dashboards', enabled: true, isGlobal: true, updatedAt: '2024-06-15T14:30:00Z' },
  { id: '3', key: 'beta-workflow-engine', name: 'Beta Workflow Engine', description: 'Enable the new workflow engine (beta)', enabled: false, isGlobal: false, updatedAt: '2024-07-05T09:00:00Z' },
  { id: '4', key: 'multi-language-support', name: 'Multi-language Support', description: 'Enable multi-language conversation support', enabled: false, isGlobal: true, updatedAt: '2024-07-03T11:00:00Z' },
  { id: '5', key: 'sla-tracking', name: 'SLA Tracking', description: 'Enable SLA deadline tracking on conversations', enabled: true, isGlobal: false, updatedAt: '2024-07-06T08:00:00Z' },
]

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeatureFlag | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<FeatureFlag | null>(null)
  const [formKey, setFormKey] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEnabled, setFormEnabled] = useState(false)
  const [formGlobal, setFormGlobal] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => { setFlags(mockFlags); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return flags.filter(f => f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
  }, [flags, search])

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }

  const openCreate = () => { setEditing(null); setFormKey(''); setFormName(''); setFormDescription(''); setFormEnabled(false); setFormGlobal(true); setDialogOpen(true) }
  const openEdit = (f: FeatureFlag) => { setEditing(f); setFormKey(f.key); setFormName(f.name); setFormDescription(f.description); setFormEnabled(f.enabled); setFormGlobal(f.isGlobal); setDialogOpen(true) }

  const handleSave = () => {
    if (!formKey.trim() || !formName.trim()) return
    if (editing) {
      setFlags(prev => prev.map(f => f.id === editing.id ? { ...f, key: formKey.trim(), name: formName.trim(), description: formDescription.trim(), enabled: formEnabled, isGlobal: formGlobal } : f))
    } else {
      setFlags(prev => [{ id: generateId(), key: formKey.trim(), name: formName.trim(), description: formDescription.trim(), enabled: formEnabled, isGlobal: formGlobal, updatedAt: new Date().toISOString() }, ...prev])
    }
    setDialogOpen(false)
  }

  const handleDelete = () => { if (deleteConfirm) { setFlags(prev => prev.filter(f => f.id !== deleteConfirm.id)); setDeleteConfirm(null) } }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Feature Flags" description="Manage platform feature flags">
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Flag</Button>
      </PageHeader>
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Input placeholder="Search feature flags..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={80} />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Flag className="h-12 w-12" />} title={search ? 'No flags match your search' : 'No feature flags'} description={search ? 'Try a different search' : 'Create your first feature flag'} action={!search && <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Flag</Button>} /></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(flag => (
              <Card key={flag.id} className="p-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{flag.key}</code>
                        <Badge variant={flag.isGlobal ? 'info' : 'default'}>{flag.isGlobal ? 'Global' : 'Tenant'}</Badge>
                      </div>
                      <p className="mt-1 font-medium text-gray-900">{flag.name}</p>
                      {flag.description && <p className="text-sm text-gray-500 mt-0.5">{flag.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">Updated {formatDate(flag.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => toggleFlag(flag.id)} title={flag.enabled ? 'Disable' : 'Enable'}>
                        {flag.enabled ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(flag)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(flag)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit Feature Flag' : 'Create Feature Flag'} description={editing ? 'Update the feature flag settings.' : 'Define a new feature flag.'}
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formKey.trim() || !formName.trim()}>{editing ? 'Save Changes' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Key" value={formKey} onChange={e => setFormKey(e.target.value)} placeholder="e.g. my-feature-flag" />
          <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. My Feature Flag" />
          <Input label="Description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Describe this feature flag" />
          <Toggle label="Enabled" checked={formEnabled} onChange={setFormEnabled} />
          <Toggle label="Global (available to all tenants)" checked={formGlobal} onChange={setFormGlobal} />
        </div>
      </Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Feature Flag" description={`Are you sure you want to delete "${deleteConfirm?.name}"?`} size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>} />
    </>
  )
}
