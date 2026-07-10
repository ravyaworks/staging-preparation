'use client'

import { Card, CardContent, Toggle } from '@conversation-platform/ui'
import { ChannelStatusBadge } from './ChannelStatusBadge'
import { formatDate } from '@/lib/utils'
import { ReactNode } from 'react'

type Status = 'connected' | 'disconnected' | 'error'

interface ChannelCardProps {
  name: string
  icon: ReactNode
  status: Status
  enabled: boolean
  lastActivity: string | null
  onToggle: (enabled: boolean) => void
}

export function ChannelCard({ name, icon, status, enabled, lastActivity, onToggle }: ChannelCardProps) {
  return (
    <Card className="bg-card border-border" aria-label={`${name} channel`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted" aria-hidden="true">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{name}</p>
              <ChannelStatusBadge status={status} />
            </div>
          </div>
          <Toggle
            checked={enabled}
            onChange={onToggle}
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${name} channel`}
          />
        </div>
        {lastActivity && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last activity: {formatDate(lastActivity)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
