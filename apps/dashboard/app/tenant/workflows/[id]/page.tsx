'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card, CardContent, Button, Badge, Toggle, Select,
  Skeleton, ErrorState,
} from '@conversation-platform/ui'
import {
  Play, Save, History, ChevronLeft,
  GitBranch, Settings,
} from 'lucide-react'
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas'
import { WorkflowNodeEditor } from '@/components/workflow/workflow-node-editor'
import { TriggerSelector } from '@/components/workflow/trigger-selector'
import { ActionSelector } from '@/components/workflow/action-selector'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  subtype: string
  label: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config: Record<string, unknown>
}

interface Edge {
  from: string
  to: string
  label?: string
}

interface WorkflowVersion {
  version: number
  date: string
  label: string
}

const mockNodes: WorkflowNode[] = [
  {
    id: 'n1', type: 'trigger', subtype: 'message_received',
    label: 'New Message', status: 'success',
    config: { matchType: 'any' },
  },
  {
    id: 'n2', type: 'action', subtype: 'send_message',
    label: 'Reply to User', status: 'idle',
    config: { messageType: 'text', content: 'Thanks for your message! We will get back to you shortly.' },
  },
  {
    id: 'n3', type: 'condition', subtype: 'condition',
    label: 'Check Priority', status: 'idle',
    config: { field: 'message.sentiment', operator: 'equals', value: 'negative', continueOnFalse: true },
  },
  {
    id: 'n4', type: 'action', subtype: 'call_tool',
    label: 'Escalate to Agent', status: 'idle',
    config: { toolName: 'escalate_to_agent', parameters: '{"priority": "high"}' },
  },
  {
    id: 'n5', type: 'action', subtype: 'transform_data',
    label: 'Format Response', status: 'idle',
    config: { mapping: '{"output": "{{input.body}}"}' },
  },
]

const mockEdges: Edge[] = [
  { from: 'n1', to: 'n2' },
  { from: 'n2', to: 'n3' },
  { from: 'n3', to: 'n4', label: 'true' },
  { from: 'n3', to: 'n5', label: 'false' },
]

const workflowVersions: WorkflowVersion[] = [
  { version: 3, date: '2024-07-08T10:30:00Z', label: 'Added sentiment check' },
  { version: 2, date: '2024-07-05T14:20:00Z', label: 'Updated reply message' },
  { version: 1, date: '2024-06-01T09:00:00Z', label: 'Initial version' },
]

const tabItems = [
  { id: 'editor', label: 'Editor', icon: GitBranch },
  { id: 'runs', label: 'Run Log', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function WorkflowDetailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('editor')
  const [status, setStatus] = useState<'active' | 'paused' | 'error'>('active')
  const [selectedVersion, setSelectedVersion] = useState(3)

  const [nodes, setNodes] = useState<WorkflowNode[]>(mockNodes)
  const [edges, setEdges] = useState<Edge[]>(mockEdges)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [showTriggerSelector, setShowTriggerSelector] = useState(false)
  const [showActionSelector, setShowActionSelector] = useState(false)
  const [addingAfterId, setAddingAfterId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node)
  }

  const handleNodeSave = (updated: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setSelectedNode(null)
  }

  const handleNodeDelete = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId))
    setSelectedNode(null)
  }

  const handleAddStep = (afterNodeId: string) => {
    setAddingAfterId(afterNodeId)
    const afterNode = nodes.find((n) => n.id === afterNodeId)
    if (afterNode?.type === 'trigger') {
      setShowTriggerSelector(false)
      setShowActionSelector(true)
    } else {
      setShowTriggerSelector(false)
      setShowActionSelector(true)
    }
  }

  const handleAddNode = (subtype: string) => {
    const newNode: WorkflowNode = {
      id: `n${Date.now()}`,
      type: subtype === 'condition' ? 'condition' : 'action',
      subtype,
      label: '',
      config: {},
    }

    if (!addingAfterId) { return }
    const insertIndex = nodes.findIndex((n) => n.id === addingAfterId)
    const newNodes = [...nodes]
    newNodes.splice(insertIndex + 1, 0, newNode)
    setNodes(newNodes)

    const fromId = addingAfterId
    const oldEdge = edges.find((e) => e.from === fromId)
    if (oldEdge) {
      setEdges((prev) => [
        ...prev.filter((e) => e.from !== fromId),
        { from: fromId, to: newNode.id },
        { from: newNode.id, to: oldEdge.to },
      ])
    } else {
      setEdges((prev) => [...prev, { from: fromId, to: newNode.id }])
    }

    setShowActionSelector(false)
    setAddingAfterId(null)
    setSelectedNode(newNode)
  }

  const handleRunNow = () => {
    const runningNode = nodes[0]
    if (runningNode) {
      setNodes((prev) =>
        prev.map((n, i) => (i === 0 ? { ...n, status: 'running' as const } : n))
      )
      setTimeout(() => {
        setNodes((prev) =>
          prev.map((n, i) =>
            i === 0
              ? { ...n, status: 'success' as const }
              : i === 1
                ? { ...n, status: 'running' as const }
                : n
          )
        )
        setTimeout(() => {
          setNodes((prev) => prev.map((n) => ({ ...n, status: 'idle' as const })))
        }, 2000)
      }, 1500)
    }
  }

  const handleToggleStatus = () => {
    setStatus((s) => (s === 'active' ? 'paused' : 'active'))
  }

  const selectedNodeData = nodes.find((n) => n.id === selectedNode?.id) || selectedNode

  const runLogs = useMemo(() => [
    { id: 'run_001', status: 'success' as const, started: '2024-07-08T10:30:00Z', duration: '1.2s', trigger: 'message_received' },
    { id: 'run_002', status: 'failed' as const, started: '2024-07-08T09:15:00Z', duration: '0.8s', trigger: 'message_received' },
    { id: 'run_003', status: 'success' as const, started: '2024-07-07T14:20:00Z', duration: '2.1s', trigger: 'message_received' },
    { id: 'run_004', status: 'running' as const, started: '2024-07-08T11:00:00Z', duration: '--', trigger: 'webhook' },
    { id: 'run_005', status: 'pending' as const, started: '--', duration: '--', trigger: 'schedule' },
  ], [])

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load workflow" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <div className="border-b bg-background">
        <div className="px-6 py-3 flex items-center gap-4">
          <Link href="/tenant/workflows" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">Welcome Message</h1>
              <Badge variant={status === 'active' ? 'success' : status === 'error' ? 'danger' : 'warning'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">Send welcome message to new users</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pr-4 border-r">
              <span className="text-sm text-gray-500">Enabled</span>
              <Toggle checked={status === 'active'} onChange={handleToggleStatus} />
            </div>
            <Select
              value={String(selectedVersion)}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              options={workflowVersions.map((v) => ({
                value: String(v.version),
                label: `v${v.version} - ${v.label}`,
              }))}
              className="w-48"
            />
            <Button variant="outline" size="sm" onClick={handleRunNow} disabled={status !== 'active'}>
              <Play className="h-4 w-4" />
              Run Now
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="px-6">
          <nav className="flex gap-0 -mb-px" role="tablist">
            {tabItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 inline-flex items-center gap-2 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton variant="rectangular" width="100%" height={400} className="rounded-lg" />
          </div>
        ) : activeTab === 'editor' ? (
          <div className="flex h-full">
            <div className="flex-1 overflow-auto p-6">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNode?.id}
                onNodeClick={handleNodeClick}
                onAddStep={handleAddStep}
              />
            </div>

            {showActionSelector && (
              <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Add Action</h3>
                    <Button variant="ghost" size="sm" onClick={() => { setShowActionSelector(false); setAddingAfterId(null); }}>
                      Cancel
                    </Button>
                  </div>
                  <ActionSelector onSelect={handleAddNode} />
                </div>
              </div>
            )}

            {showTriggerSelector && (
              <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Add Trigger</h3>
                    <Button variant="ghost" size="sm" onClick={() => { setShowTriggerSelector(false); setAddingAfterId(null); }}>
                      Cancel
                    </Button>
                  </div>
                  <TriggerSelector onSelect={(subtype) => {
                    const newNode: WorkflowNode = {
                      id: `n${Date.now()}`,
                      type: 'trigger',
                      subtype,
                      label: '',
                      config: {},
                    }
                    setNodes((prev) => [newNode, ...prev])
                    setShowTriggerSelector(false)
                    setAddingAfterId(null)
                    setSelectedNode(newNode)
                  }} />
                </div>
              </div>
            )}

            {selectedNode && !showActionSelector && !showTriggerSelector && (
              <div className="w-80 border-l bg-white p-4 overflow-y-auto">
                <WorkflowNodeEditor
                  node={selectedNodeData || null}
                  onSave={handleNodeSave}
                  onCancel={() => setSelectedNode(null)}
                  onDelete={handleNodeDelete}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'runs' ? (
          <div className="p-6">
            <Card className="p-0">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Run ID</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trigger</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Started</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runLogs.map((run) => (
                      <tr key={run.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-900">{run.id}</td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            run.status === 'success' ? 'success' :
                            run.status === 'failed' ? 'danger' :
                            run.status === 'running' ? 'warning' : 'warning'
                          }>
                            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{run.trigger.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{run.started}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{run.duration}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/tenant/workflows/wf_001/runs`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="p-6">
            <Card className="p-0">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Workflow Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Error Notification</span>
                      <Toggle checked onChange={() => {}} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Retry on Failure</span>
                      <Toggle checked onChange={() => {}} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Log Execution Details</span>
                      <Toggle checked onChange={() => {}} />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h3>
                  <p className="text-xs text-gray-500 mb-3">Permanently delete this workflow and all its run history.</p>
                  <Button variant="danger" size="sm">Delete Workflow</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
