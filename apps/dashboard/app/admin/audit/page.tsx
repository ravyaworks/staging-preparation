'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Select, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate } from '@/lib/utils'
import {
  FileText, Search, ChevronDown, ChevronRight,
} from 'lucide-react'

interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  resourceId: string
  details: string
  ip: string
  status: 'success' | 'failure' | 'pending'
}

const mockEvents: AuditEvent[] = [
  { id: 'e1', timestamp: '2024-07-06T14:30:00Z', actor: 'admin@example.com', action: 'tenant.create', resource: 'Tenant', resourceId: 't-001', details: 'Created tenant "Acme Corp"', ip: '192.168.1.100', status: 'success' },
  { id: 'e2', timestamp: '2024-07-06T14:25:00Z', actor: 'admin@example.com', action: 'user.invite', resource: 'User', resourceId: 'u-045', details: 'Invited user "john@acme.com" to Acme Corp', ip: '192.168.1.100', status: 'success' },
  { id: 'e3', timestamp: '2024-07-06T13:15:00Z', actor: 'super@example.com', action: 'settings.update', resource: 'Settings', resourceId: 'platform', details: 'Updated security settings (password policy)', ip: '10.0.0.15', status: 'success' },
  { id: 'e4', timestamp: '2024-07-06T12:00:00Z', actor: 'jane@globex.com', action: 'auth.login', resource: 'Session', resourceId: 's-892', details: 'Failed login attempt from unrecognized device', ip: '203.0.113.45', status: 'failure' },
  { id: 'e5', timestamp: '2024-07-06T11:30:00Z', actor: 'admin@example.com', action: 'tenant.update', resource: 'Tenant', resourceId: 't-003', details: 'Updated Initech domain settings', ip: '192.168.1.100', status: 'success' },
  { id: 'e6', timestamp: '2024-07-06T10:45:00Z', actor: 'system', action: 'billing.invoice', resource: 'Invoice', resourceId: 'inv-042', details: 'Generated monthly invoice for Globex Inc ($1,240.00)', ip: 'system', status: 'success' },
  { id: 'e7', timestamp: '2024-07-06T09:20:00Z', actor: 'super@example.com', action: 'role.update', resource: 'Role', resourceId: 'r-001', details: 'Modified permissions for "Support Agent" role', ip: '10.0.0.15', status: 'success' },
  { id: 'e8', timestamp: '2024-07-06T08:00:00Z', actor: 'alice@umbrella.com', action: 'tenant.delete', resource: 'Tenant', resourceId: 't-009', details: 'Deleted tenant "Old Corp"', ip: '172.16.0.50', status: 'failure' },
  { id: 'e9', timestamp: '2024-07-05T22:15:00Z', actor: 'unknown@malicious.com', action: 'auth.login', resource: 'Session', resourceId: 's-901', details: 'Brute force attack detected - 15 failed attempts', ip: '45.33.32.156', status: 'failure' },
  { id: 'e10', timestamp: '2024-07-05T18:30:00Z', actor: 'admin@example.com', action: 'api.key_generate', resource: 'API Key', resourceId: 'ak-023', details: 'Generated new API key for Acme Corp', ip: '192.168.1.100', status: 'success' },
  { id: 'e11', timestamp: '2024-07-05T16:00:00Z', actor: 'system', action: 'backup.complete', resource: 'Backup', resourceId: 'bk-007', details: 'Daily backup completed successfully (2.4 GB)', ip: 'system', status: 'success' },
  { id: 'e12', timestamp: '2024-07-05T14:00:00Z', actor: 'bob@initech.com', action: 'conversation.export', resource: 'Conversation', resourceId: 'conv-341', details: 'Exported conversation "Support ticket #1024" as PDF', ip: '198.51.100.20', status: 'success' },
]

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'auth.login', label: 'Login' },
  { value: 'tenant.create', label: 'Tenant Created' },
  { value: 'tenant.update', label: 'Tenant Updated' },
  { value: 'tenant.delete', label: 'Tenant Deleted' },
  { value: 'user.invite', label: 'User Invited' },
  { value: 'settings.update', label: 'Settings Updated' },
  { value: 'role.update', label: 'Role Updated' },
  { value: 'billing.invoice', label: 'Invoice' },
  { value: 'api.key_generate', label: 'API Key Generated' },
  { value: 'backup.complete', label: 'Backup' },
]

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(mockEvents)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return events.filter((e) => {
      const matchesSearch =
        e.actor.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q) ||
        e.ip.includes(q)
      const matchesAction = !actionFilter || e.action === actionFilter
      return matchesSearch && matchesAction
    })
  }, [events, search, actionFilter])

  const statusBadge: Record<string, 'success' | 'danger' | 'warning'> = {
    success: 'success',
    failure: 'danger',
    pending: 'warning',
  }

  const actionLabel = (action: string) =>
    action
      .replace(/\./g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load audit log" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Audit Log" description="Track all administrative actions across the platform" />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search audit log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={actionOptions}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {loading ? (
          <Card className="p-0">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="18%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="8%" />
                </div>
              ))}
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title={search || actionFilter ? 'No events match your filters' : 'No audit events yet'}
              description={search || actionFilter ? 'Try adjusting your search or filter criteria' : 'Audit events will appear here as actions are performed'}
            />
          </Card>
        ) : (
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event) => (
                  <>
                    <TableRow
                      key={event.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="p-0">
                          {expandedId === event.id ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(event.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{event.actor}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{actionLabel(event.action)}</span>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        <span className="text-xs">{event.resource}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">{event.ip}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[event.status]}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedId === event.id && (
                      <TableRow key={`${event.id}-details`}>
                        <TableCell colSpan={7} className="bg-gray-50 px-8 py-4">
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium text-gray-700">Resource ID:</span>{' '}
                              <span className="font-mono text-gray-500">{event.resourceId}</span>
                            </p>
                            <p>
                              <span className="font-medium text-gray-700">Details:</span>{' '}
                              <span className="text-gray-600">{event.details}</span>
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  )
}
