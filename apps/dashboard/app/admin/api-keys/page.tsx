'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Dialog, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate, generateId } from '@/lib/utils'
import { Key, Plus, Trash2, RefreshCw, Copy, AlertTriangle } from 'lucide-react'

interface ApiKey {
  id: string; name: string; prefix: string; isActive: boolean; lastUsedAt: string | null; expiresAt: string | null; createdAt: string
}

const mockKeys: ApiKey[] = [
  { id: '1', name: 'Production API Key', prefix: 'cp_a1b2c3', isActive: true, lastUsedAt: '2024-07-06T14:30:00Z', expiresAt: null, createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', name: 'Staging Key', prefix: 'cp_d4e5f6', isActive: true, lastUsedAt: '2024-07-05T09:15:00Z', expiresAt: '2024-12-31T23:59:59Z', createdAt: '2024-02-20T14:00:00Z' },
  { id: '3', name: 'Dev Integration', prefix: 'cp_g7h8i9', isActive: false, lastUsedAt: '2024-06-01T11:00:00Z', expiresAt: null, createdAt: '2024-03-10T08:15:00Z' },
]

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ApiKey | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setKeys(mockKeys); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handleCreate = () => {
    if (!formName.trim()) return
    const keyValue = `cp_${Array.from({ length: 64 }, () => Math.random().toString(36)[2]).join('')}`
    const newKey: ApiKey = { id: generateId(), name: formName.trim(), prefix: keyValue.substring(0, 10), isActive: true, lastUsedAt: null, expiresAt: null, createdAt: new Date().toISOString() }
    setKeys(prev => [newKey, ...prev])
    setNewKeyValue(keyValue)
    setFormName('')
  }

  const handleRevoke = () => {
    if (!deleteConfirm) return
    setKeys(prev => prev.filter(k => k.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const copyToClipboard = (val: string) => navigator.clipboard?.writeText(val)

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="API Keys" description="Manage API keys for external integrations">
        <Button onClick={() => { setNewKeyValue(null); setDialogOpen(true) }}><Plus className="h-4 w-4" /> Create API Key</Button>
      </PageHeader>
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={60} />)}</div>
        ) : keys.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Key className="h-12 w-12" />} title="No API keys" description="Create an API key to integrate with external services" action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Create API Key</Button>} /></Card>
        ) : (
          <div className="space-y-3">
            {keys.map(k => (
              <Card key={k.id} className="p-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{k.name}</span>
                      <Badge variant={k.isActive ? 'success' : 'danger'}>{k.isActive ? 'Active' : 'Revoked'}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{k.prefix}...</code>
                      <span className="text-xs text-gray-400">Last used: {k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never'}</span>
                      {k.expiresAt && <span className="text-xs text-gray-400">Expires: {formatDate(k.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(k.prefix)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm"><RefreshCw className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(k)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setNewKeyValue(null) }}
        title={newKeyValue ? 'API Key Created' : 'Create API Key'}
        description={newKeyValue ? 'Copy this key now. You will not be able to see it again.' : 'Create a new API key for external integrations.'}
        footer={newKeyValue ? (
          <><Button variant="outline" onClick={() => { setDialogOpen(false); setNewKeyValue(null) }}>Close</Button><Button onClick={() => { copyToClipboard(newKeyValue); setDialogOpen(false); setNewKeyValue(null) }}><Copy className="h-4 w-4" /> Copy & Close</Button></>
        ) : (
          <><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!formName.trim()}>Create</Button></>
        )}>
        {newKeyValue ? (
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">This is the only time you will see this key. Store it securely.</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">{newKeyValue}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKeyValue)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <Input label="Key Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Production Integration" />
        )}
      </Dialog>
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Revoke API Key"
        description={`Are you sure you want to revoke "${deleteConfirm?.name}"? This cannot be undone.`} size="sm"
        footer={<><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="danger" onClick={handleRevoke}>Revoke</Button></>} />
    </>
  )
}
