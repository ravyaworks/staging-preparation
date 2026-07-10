'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Dialog,
  Input,
  EmptyState,
} from '@conversation-platform/ui'
import { Key, Copy, Check, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  status: 'active' | 'revoked'
  created: string
  expires: string | null
  lastUsed: string | null
}

interface ApiKeyListProps {
  keys: ApiKey[]
  onCreate: (key: { name: string; scopes: string[]; expires: string | null }) => void
  onRevoke: (id: string) => void
}

const scopeOptions = [
  { value: 'messages:read', label: 'Messages: Read' },
  { value: 'messages:write', label: 'Messages: Write' },
  { value: 'conversations:read', label: 'Conversations: Read' },
  { value: 'conversations:write', label: 'Conversations: Write' },
  { value: 'contacts:read', label: 'Contacts: Read' },
  { value: 'contacts:write', label: 'Contacts: Write' },
  { value: 'analytics:read', label: 'Analytics: Read' },
  { value: 'admin', label: 'Admin (Full Access)' },
]

const scopeColors: Record<string, 'default' | 'success' | 'info' | 'warning' | 'danger'> = {
  'messages:read': 'info',
  'messages:write': 'success',
  'conversations:read': 'info',
  'conversations:write': 'success',
  'contacts:read': 'info',
  'contacts:write': 'success',
  'analytics:read': 'info',
  admin: 'danger',
}

export function ApiKeyList({ keys, onCreate, onRevoke }: ApiKeyListProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [showKeyId, setShowKeyId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>([])
  const [newExpires, setNewExpires] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const handleCopy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard not available
    }
  }

  const toggleScope = (scope: string) => {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleCreate = () => {
    if (!newName) { return }
    const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    onCreate({
      name: newName,
      scopes: newScopes,
      expires: newExpires || null,
    })
    setCreatedKey(key)
    setNewName('')
    setNewScopes([])
    setNewExpires('')
  }

  const handleCloseCreate = () => {
    setShowCreate(false)
    setCreatedKey(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-muted-foreground">Manage API keys for programmatic access.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Key
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Key className="h-12 w-12" />}
              title="No API keys"
              description="Create your first API key to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="text-sm font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                          {showKeyId === key.id ? key.prefix : `${key.prefix}****`}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                          aria-label={showKeyId === key.id ? 'Hide key' : 'Show key'}
                        >
                          {showKeyId === key.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(key.prefix, key.id)}
                          aria-label="Copy key"
                        >
                          {copiedId === key.id
                            ? <Check className="h-3.5 w-3.5 text-green-500" />
                            : <Copy className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant={scopeColors[scope] ?? 'default'} className="text-[10px]">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === 'active' ? 'success' : 'danger'}>
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(key.created)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.expires ? formatDate(key.expires) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeId(key.id)}
                        disabled={key.status === 'revoked'}
                        aria-label={`Revoke ${key.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showCreate}
        onClose={handleCloseCreate}
        title={createdKey ? 'API Key Created' : 'Create API Key'}
        description={createdKey ? 'Copy this key now. You will not be able to see it again.' : 'Create a new API key for programmatic access.'}
        size="md"
        footer={
          createdKey ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseCreate}>Done</Button>
              <Button onClick={() => createdKey && handleCopy(createdKey, 'new')}>
                {copiedId === 'new' ? (
                  <><Check className="mr-1.5 h-4 w-4" />Copied</>
                ) : (
                  <><Copy className="mr-1.5 h-4 w-4" />Copy Key</>
                )}
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={handleCloseCreate}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName}>Create</Button>
            </>
          )
        }
      >
        {createdKey ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <code className="break-all text-sm font-mono">{createdKey}</code>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              Make sure to copy your API key now. You will not be able to see it again for security reasons.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Key Name"
              placeholder="e.g. Production API Key"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Scopes</label>
              <div className="space-y-2">
                {scopeOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newScopes.includes(opt.value)}
                      onChange={() => toggleScope(opt.value)}
                      className="rounded border-border"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <Input
              label="Expiration (optional)"
              type="date"
              value={newExpires}
              onChange={(e) => setNewExpires(e.target.value)}
            />
          </div>
        )}
      </Dialog>

      <Dialog
        open={revokeId !== null}
        onClose={() => setRevokeId(null)}
        title="Revoke API Key"
        description="Are you sure you want to revoke this API key? Any services using it will immediately lose access."
        footer={
          <>
            <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (revokeId) { onRevoke(revokeId) }
                setRevokeId(null)
              }}
            >
              Revoke
            </Button>
          </>
        }
      />
    </div>
  )
}
