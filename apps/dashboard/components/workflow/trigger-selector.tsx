'use client'

import { MessageSquare, Clock, Globe, Zap } from 'lucide-react'

const triggerTypes = [
  {
    id: 'message_received',
    name: 'Message Received',
    description: 'Trigger when a new message is received in a conversation',
    icon: MessageSquare,
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Trigger on a recurring schedule using cron expressions',
    icon: Clock,
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Trigger via an incoming webhook HTTP request',
    icon: Globe,
  },
  {
    id: 'event',
    name: 'Event',
    description: 'Trigger on platform events like status changes',
    icon: Zap,
  },
]

interface TriggerSelectorProps {
  selected?: string
  onSelect: (type: string) => void
}

export function TriggerSelector({ selected, onSelect }: TriggerSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {triggerTypes.map((trigger) => {
        const Icon = trigger.icon
        const isSelected = selected === trigger.id
        return (
          <button
            key={trigger.id}
            type="button"
            className={`cursor-pointer text-left w-full p-4 rounded-xl transition-all hover:border-blue-300 border-2 ${
              isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'border-gray-200 bg-white shadow-sm'
            }`}
            onClick={() => onSelect(trigger.id)}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={`rounded-lg p-2 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{trigger.name}</span>
              <span className="text-xs text-gray-500 leading-tight">{trigger.description}</span>
            </div>
            </button>
        )
      })}
    </div>
  )
}
