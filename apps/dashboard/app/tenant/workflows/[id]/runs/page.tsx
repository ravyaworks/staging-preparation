'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, Badge, Button, Input, Select,
  Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { cn, formatDate } from '@/lib/utils'
import {
  History, Search, ChevronLeft, Play, XCircle,
  CheckCircle, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react'

type RunStatus = 'success' | 'failed' | 'running' | 'pending'

interface WorkflowRun {
  id: string
  workflowId: string
  workflowName: string
  status: RunStatus
  trigger: string
  started: string
  completed: string | null
  duration: string | null
  error?: string
}

const mockRuns: WorkflowRun[] = [
  {
    id: 'run_001', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'success', trigger: 'message_received',
    started: '2024-07-08T10:30:00Z', completed: '2024-07-08T10:30:01Z', duration: '1.2s',
  },
  {
    id: 'run_002', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'failed', trigger: 'message_received',
    started: '2024-07-08T09:15:00Z', completed: '2024-07-08T09:15:01Z', duration: '0.8s',
    error: 'Tool execution timed out',
  },
  {
    id: 'run_003', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'success', trigger: 'message_received',
    started: '2024-07-07T14:20:00Z', completed: '2024-07-07T14:20:02Z', duration: '2.1s',
  },
  {
    id: 'run_004', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'running', trigger: 'webhook',
    started: '2024-07-08T11:00:00Z', completed: null, duration: null,
  },
  {
    id: 'run_005', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'pending', trigger: 'schedule',
    started: '2024-07-09T06:00:00Z', completed: null, duration: null,
  },
  {
    id: 'run_006', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'success', trigger: 'message_received',
    started: '2024-07-07T10:00:00Z', completed: '2024-07-07T10:00:01Z', duration: '0.9s',
  },
  {
    id: 'run_007', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'success', trigger: 'message_received',
    started: '2024-07-06T16:45:00Z', completed: '2024-07-06T16:45:01Z', duration: '1.1s',
  },
  {
    id: 'run_008', workflowId: 'wf_001', workflowName: 'Welcome Message',
    status: 'failed', trigger: 'event',
    started: '2024-07-06T08:30:00Z', completed: '2024-07-06T08:30:01Z', duration: '0.5s',
    error: 'Invalid event payload',
  },
]

const statusConfig: Record<RunStatus, { label: string; variant: 'success' | 'danger' | 'warning'; icon: React.ElementType }> = {
  success: { label: 'Success', variant: 'success', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'danger', icon: XCircle },
  running: { label: 'Running', variant: 'warning', icon: Play },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
}

export default function WorkflowRunsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRuns(mockRuns)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return runs.filter((run) => {
      if (statusFilter !== 'all' && run.status !== statusFilter) {return false}
      if (q && !run.id.toLowerCase().includes(q) && !run.trigger.toLowerCase().includes(q)) {return false}
      return true
    })
  }, [runs, search, statusFilter])

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load run history" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Run History" description="View workflow execution history">
        <Button variant="outline" onClick={() => setLoading(true)}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Link
            href="/tenant/workflows/wf_001"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Workflow
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by run ID or trigger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'success', label: 'Success' },
              { value: 'failed', label: 'Failed' },
              { value: 'running', label: 'Running' },
              { value: 'pending', label: 'Pending' },
            ]}
            className="w-40"
          />
        </div>

        {loading ? (
          <Card className="p-0">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="12%" />
                  <Skeleton variant="text" width="18%" />
                  <Skeleton variant="text" width="18%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="10%" />
                </div>
              ))}
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<History className="h-12 w-12" />}
              title={search || statusFilter !== 'all' ? 'No runs match your filters' : 'No runs yet'}
              description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Run your workflow to see execution history here'}
            />
          </Card>
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Run ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trigger</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((run) => {
                    const config = statusConfig[run.status]
                    const StatusIcon = config.icon
                    return (
                      <tr
                        key={run.id}
                        className={cn(
                          'border-b last:border-0',
                          selectedRun?.id === run.id ? 'bg-blue-50' : 'hover:bg-gray-50',
                          'cursor-pointer'
                        )}
                        onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-900">{run.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={config.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                          {run.trigger.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {run.started === '--' ? '--' : formatDate(run.started)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {run.duration ? (
                            <span className="font-mono text-gray-700">{run.duration}</span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRun(selectedRun?.id === run.id ? null : run)
                            }}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {selectedRun && (
          <Card className="p-0 border-blue-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Run Details — <span className="font-mono">{selectedRun.id}</span>
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}>
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <Badge variant={statusConfig[selectedRun.status].variant}>
                    {statusConfig[selectedRun.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Trigger</p>
                  <p className="font-medium capitalize">{selectedRun.trigger.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Started</p>
                  <p className="font-medium">{selectedRun.started === '--' ? '--' : formatDate(selectedRun.started)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Duration</p>
                  <p className="font-medium font-mono">{selectedRun.duration || 'In progress'}</p>
                </div>
              </div>
              {selectedRun.error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">Error</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">{selectedRun.error}</p>
                </div>
              )}
              {selectedRun.status === 'running' && (
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">Workflow is currently executing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
