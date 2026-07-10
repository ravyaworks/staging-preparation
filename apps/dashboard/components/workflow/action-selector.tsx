'use client'

import { MessageSquare, Code, GitBranch, Database, Globe, GitFork } from 'lucide-react'

const actionTypes = [
  {
    id: 'send_message',
    name: 'Send Message',
    description: 'Send a message to a conversation or user',
    icon: MessageSquare,
  },
  {
    id: 'call_tool',
    name: 'Call Tool',
    description: 'Execute a registered tool or function',
    icon: Code,
  },
  {
    id: 'run_workflow',
    name: 'Run Workflow',
    description: 'Trigger another workflow execution',
    icon: GitBranch,
  },
  {
    id: 'transform_data',
    name: 'Transform Data',
    description: 'Map and transform JSON data between steps',
    icon: Database,
  },
  {
    id: 'http_request',
    name: 'HTTP Request',
    description: 'Make an external HTTP request',
    icon: Globe,
  },
  {
    id: 'condition',
    name: 'Condition',
    description: 'Branch logic based on a condition',
    icon: GitFork,
  },
]

interface ActionSelectorProps {
  selected?: string
  onSelect: (type: string) => void
}

export function ActionSelector({ selected, onSelect }: ActionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actionTypes.map((action) => {
        const Icon = action.icon
        const isSelected = selected === action.id
        return (
          <button
            key={action.id}
            type="button"
            className={`cursor-pointer text-left w-full p-4 rounded-xl transition-all hover:border-blue-300 border-2 ${
              isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'border-gray-200 bg-white shadow-sm'
            }`}
            onClick={() => onSelect(action.id)}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`rounded-lg p-2 ${isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.name}</span>
              <span className="text-xs text-gray-500 leading-tight">{action.description}</span>
            </div>
            </button>
        )
      })}
    </div>
  )
}
