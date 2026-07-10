'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  MessageSquare, Clock, Globe, Zap, Code, GitBranch,
  Database, GitFork, Play, AlertTriangle, Plus,
  ArrowRight, FileText,
} from 'lucide-react'

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

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNodeId?: string
  onNodeClick: (node: WorkflowNode) => void
  onAddStep: (afterNodeId: string) => void
}

const nodeTypeIcons: Record<string, React.ElementType> = {
  message_received: MessageSquare,
  schedule: Clock,
  webhook: Globe,
  event: Zap,
  send_message: MessageSquare,
  call_tool: Code,
  run_workflow: GitBranch,
  transform_data: Database,
  http_request: Globe,
  condition: GitFork,
}

function getSubtypeLabel(subtype: string): string {
  const labels: Record<string, string> = {
    message_received: 'Message Received',
    schedule: 'Schedule',
    webhook: 'Webhook',
    event: 'Event',
    send_message: 'Send Message',
    call_tool: 'Call Tool',
    run_workflow: 'Run Workflow',
    transform_data: 'Transform Data',
    http_request: 'HTTP Request',
    condition: 'If/Else',
  }
  return labels[subtype] || subtype
}

function NodeCard({ node, isSelected, onClick }: { node: WorkflowNode; isSelected: boolean; onClick: () => void }) {
  const Icon = nodeTypeIcons[node.subtype] || FileText
  const isCondition = node.type === 'condition'

  if (isCondition) {
    return (
      <div
        className={cn(
          'relative cursor-pointer select-none transition-all hover:shadow-md w-48',
          isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
        )}
        onClick={onClick}
      >
        <svg className="w-48 h-20" viewBox="0 0 192 80">
          <polygon
            points="96,4 188,40 96,76 4,40"
            className={cn('stroke-2', isSelected ? 'stroke-blue-500' : 'stroke-amber-400')}
            fill={isSelected ? '#eff6ff' : '#fffbeb'}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-6">
          <Icon className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="text-xs font-medium text-amber-900 truncate">
            {node.label || getSubtypeLabel(node.subtype)}
          </div>
        </div>
        <div className="absolute -top-1.5 -right-1.5">
          <div className="flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 shadow-sm">
            <GitFork className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-700">if/else</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'cursor-pointer select-none transition-all hover:shadow-md w-56 rounded-xl bg-white border shadow-sm',
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : '',
        node.type === 'trigger' ? 'border-blue-400' :
        node.type === 'action' ? 'border-purple-400' :
        'border-amber-400'
      )}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              'rounded-md p-1.5',
              node.type === 'trigger' ? 'bg-blue-100 text-blue-600' :
              node.type === 'action' ? 'bg-purple-100 text-purple-600' :
              'bg-amber-100 text-amber-600'
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {node.type}
            </span>
          </div>
          {node.status && node.status !== 'idle' && (
            <div className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full',
              node.status === 'running' && 'text-blue-500',
              node.status === 'success' && 'text-green-500',
              node.status === 'error' && 'text-red-500',
            )}>
              {node.status === 'running' && <Play className="h-3 w-3" />}
              {node.status === 'success' && <Play className="h-3 w-3" />}
              {node.status === 'error' && <AlertTriangle className="h-3 w-3" />}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">
          {node.label || getSubtypeLabel(node.subtype)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{getSubtypeLabel(node.subtype)}</p>
      </div>
    </div>
  )
}

function EdgeLine({ fromRect, toRect, label }: { fromRect: DOMRect; toRect: DOMRect; label?: string }) {
  const fromX = fromRect.left + fromRect.width / 2
  const fromY = fromRect.bottom
  const toX = toRect.left + toRect.width / 2
  const toY = toRect.top

  const midY = (fromY + toY) / 2

  const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        className="edge-line"
      />
      {label && (
        <>
          <circle cx={toX} cy={toY - 6} r="3" fill="#d1d5db" />
          <text
            x={(fromX + toX) / 2}
            y={midY - 6}
            textAnchor="middle"
            className="text-[10px] fill-gray-500"
          >
            {label}
          </text>
        </>
      )}
    </g>
  )
}

export function WorkflowCanvas({ nodes, edges, selectedNodeId, onNodeClick, onAddStep }: WorkflowCanvasProps) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodeRects, setNodeRects] = useState<Record<string, DOMRect>>({})

  useEffect(() => {
    const rects: Record<string, DOMRect> = {}
    Object.entries(nodeRefs.current).forEach(([id, el]) => {
      if (el && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        rects[id] = {
          top: elRect.top - containerRect.top,
          bottom: elRect.bottom - containerRect.top,
          left: elRect.left - containerRect.left,
          right: elRect.right - containerRect.left,
          width: elRect.width,
          height: elRect.height,
          x: elRect.x - containerRect.x,
          y: elRect.y - containerRect.y,
        } as DOMRect
      }
    })
    setNodeRects(rects)
  }, [nodes])

  const visibleEdges = useMemo(() => {
    return edges.filter((e) => nodeRefs.current[e.from] && nodeRefs.current[e.to])
  }, [edges])

  return (
    <div ref={containerRef} className="relative min-h-[500px]">
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        {visibleEdges.map((edge) => {
          const fromRect = nodeRects[edge.from]
          const toRect = nodeRects[edge.to]
          if (!fromRect || !toRect) { return null }
          return (
            <EdgeLine
              key={`${edge.from}-${edge.to}`}
              fromRect={fromRect}
              toRect={toRect}
              label={edge.label}
            />
          )
        })}
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-0 py-8">
        {nodes.map((node, index) => {
          const isSelected = node.id === selectedNodeId
          return (
            <div key={node.id} className="flex flex-col items-center">
              <div
                ref={(el) => { nodeRefs.current[node.id] = el }}
              >
                <NodeCard
                  node={node}
                  isSelected={isSelected}
                  onClick={() => onNodeClick(node)}
                />
              </div>
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <div className="w-0.5 h-4 bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                      onClick={() => onAddStep(node.id)}
                      title="Add step"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-0.5 h-4 bg-gray-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {nodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <GitBranch className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">No nodes in this workflow</p>
          <p className="text-xs mt-1">Use the add button or selector to build your workflow</p>
        </div>
      )}
    </div>
  )
}
