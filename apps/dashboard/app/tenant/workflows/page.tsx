'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, Badge, Button, Input, Dialog,
  Skeleton, EmptyState, ErrorState, Toggle,
} from '@conversation-platform/ui'
import { cn, formatDate, generateId } from '@/lib/utils'
import {
  GitBranch, Plus, Play, Pause, Trash2, Edit, Copy,
  Zap, Clock, AlertTriangle, Search, MoreHorizontal,
} from 'lucide-react'
import { Dropdown } from '@conversation-platform/ui'

type WorkflowStatus = 'active' | 'paused' | 'error'

interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  triggerType: string
  lastRun: string | null
  nextRun: string | null
  createdAt: string
  updatedAt: string
}

const triggerLabels: Record<string, string> = {
  message_received: 'Message Received',
  schedule: 'Schedule',
  webhook: 'Webhook',
  event: 'Event',
}

const triggerIcons: Record<string, React.ElementType> = {
  message_received: Zap,
  schedule: Clock,
  webhook: GitBranch,
  event: Zap,
}

const mockWorkflows: Workflow[] = [
  {
    id: 'wf_001', name: 'Welcome Message', description: 'Send welcome message to new users',
    status: 'active', triggerType: 'message_received',
    lastRun: '2024-07-08T10:30:00Z', nextRun: null,
    createdAt: '2024-01-15T08:00:00Z', updatedAt: '2024-07-08T10:30:00Z',
  },
  {
    id: 'wf_002', name: 'Daily Summary', description: 'Send daily conversation summary to admins',
    status: 'active', triggerType: 'schedule',
    lastRun: '2024-07-08T06:00:00Z', nextRun: '2024-07-09T06:00:00Z',
    createdAt: '2024-02-20T12:00:00Z', updatedAt: '2024-07-08T06:00:00Z',
  },
  {
    id: 'wf_003', name: 'Webhook Sync', description: 'Sync data to external CRM via webhook',
    status: 'paused', triggerType: 'webhook',
    lastRun: '2024-07-05T14:20:00Z', nextRun: null,
    createdAt: '2024-03-10T09:30:00Z', updatedAt: '2024-07-05T14:20:00Z',
  },
  {
    id: 'wf_004', name: 'Sentiment Analysis', description: 'Analyze message sentiment and tag conversations',
    status: 'error', triggerType: 'message_received',
    lastRun: '2024-07-08T09:15:00Z', nextRun: null,
    createdAt: '2024-04-05T16:45:00Z', updatedAt: '2024-07-08T09:15:00Z',
  },
  {
    id: 'wf_005', name: 'Escalation Handler', description: 'Escalate conversations to human agents',
    status: 'active', triggerType: 'event',
    lastRun: '2024-07-08T11:00:00Z', nextRun: null,
    createdAt: '2024-05-01T10:00:00Z', updatedAt: '2024-07-08T11:00:00Z',
  },
  {
    id: 'wf_006', name: 'Nightly Cleanup', description: 'Clean up stale conversations and logs',
    status: 'active', triggerType: 'schedule',
    lastRun: '2024-07-08T00:00:00Z', nextRun: '2024-07-09T00:00:00Z',
    createdAt: '2024-05-20T14:00:00Z', updatedAt: '2024-07-08T00:00:00Z',
  },
  {
    id: 'wf_007', name: 'Data Export', description: 'Export conversation data to data warehouse',
    status: 'paused', triggerType: 'schedule',
    lastRun: '2024-06-30T23:59:00Z', nextRun: null,
    createdAt: '2024-06-10T08:00:00Z', updatedAt: '2024-06-30T23:59:00Z',
  },
]

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState<Workflow | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWorkflows(mockWorkflows)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const total = workflows.length
    const active = workflows.filter((w) => w.status === 'active').length
    const failed = workflows.filter((w) => w.status === 'error').length
    const disabled = workflows.filter((w) => w.status === 'paused').length
    return { total, active, failed, disabled }
  }, [workflows])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        triggerLabels[w.triggerType]?.toLowerCase().includes(q)
    )
  }, [workflows, search])

  const handleCreate = () => {
    if (!formName.trim()) {return}
    const newWorkflow: Workflow = {
      id: generateId(),
      name: formName.trim(),
      description: formDescription.trim(),
      status: 'paused',
      triggerType: 'message_received',
      lastRun: null,
      nextRun: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setWorkflows((prev) => [newWorkflow, ...prev])
    setCreateOpen(false)
    setFormName('')
    setFormDescription('')
  }

  const toggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) {return w}
        const newStatus: WorkflowStatus = w.status === 'active' ? 'paused' : w.status === 'paused' ? 'active' : w.status
        return { ...w, status: newStatus, updatedAt: new Date().toISOString() }
      })
    )
  }

  const handleDelete = () => {
    if (!deleteConfirm) {return}
    setWorkflows((prev) => prev.filter((w) => w.id !== deleteConfirm.id))
    setDeleteConfirm(null)
  }

  const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    paused: 'warning',
    error: 'danger',
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load workflows" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Workflows" description="Automate conversations with workflow builders">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-0">
                  <CardContent className="p-5">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="60%" className="mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-0">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="30%" />
                        <Skeleton variant="text" width="60%" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-gray-500">Total Workflows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2.5 text-green-600">
                      <Play className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.active}</p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2.5 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.failed}</p>
                      <p className="text-sm text-gray-500">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
                      <Pause className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.disabled}</p>
                      <p className="text-sm text-gray-500">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <Card className="p-0">
                <EmptyState
                  icon={<GitBranch className="h-12 w-12" />}
                  title={search ? 'No workflows match your search' : 'No workflows yet'}
                  description={search ? 'Try a different search term' : 'Create your first automation workflow'}
                  action={
                    !search && (
                      <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Create Workflow
                      </Button>
                    )
                  }
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((workflow) => {
                  const TriggerIcon = triggerIcons[workflow.triggerType] || Zap
                  return (
                    <div
                      key={workflow.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/tenant/workflows/${workflow.id}`)}
                    >
                      <Card className="p-0 hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'rounded-lg p-2.5 shrink-0',
                              workflow.status === 'active' ? 'bg-green-100 text-green-600' :
                              workflow.status === 'error' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              <TriggerIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {workflow.name}
                                </h3>
                                <Badge variant={statusBadge[workflow.status]}>
                                  {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5 truncate">{workflow.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <TriggerIcon className="h-3 w-3" />
                                  {triggerLabels[workflow.triggerType] || workflow.triggerType}
                                </span>
                                {workflow.lastRun && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Last: {formatDate(workflow.lastRun)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Toggle
                                checked={workflow.status === 'active'}
                                onChange={() => toggleStatus(workflow.id)}
                              />
                              <Dropdown
                                align="end"
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                }
                                items={[
                                  {
                                    label: 'Edit',
                                    icon: <Edit className="h-4 w-4" />,
                                    onClick: () => {},
                                  },
                                  {
                                    label: 'Duplicate',
                                    icon: <Copy className="h-4 w-4" />,
                                    onClick: () => {},
                                  },
                                  {
                                    label: 'Delete',
                                    icon: <Trash2 className="h-4 w-4" />,
                                    variant: 'danger',
                                    onClick: () => setDeleteConfirm(workflow),
                                  },
                                ]}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Workflow"
        description="Create a new automation workflow for your conversations."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formName.trim()}>
              Create Workflow
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Workflow Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Welcome Message"
          />
          <Input
            label="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Describe what this workflow does"
          />
        </div>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      />
    </>
  )
}
