'use client'

import { Badge } from '@conversation-platform/ui'

type Status = 'connected' | 'disconnected' | 'error'

interface ChannelStatusBadgeProps {
  status: Status
}

const statusConfig: Record<Status, { variant: 'success' | 'default' | 'danger'; label: string }> = {
  connected: { variant: 'success', label: 'Connected' },
  disconnected: { variant: 'default', label: 'Disconnected' },
  error: { variant: 'danger', label: 'Error' },
}

export function ChannelStatusBadge({ status }: ChannelStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span role="status" aria-label={config.label}>
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    </span>
  )
}
