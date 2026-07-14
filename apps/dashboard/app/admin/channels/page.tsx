'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Skeleton, EmptyState, ErrorState,
} from '@conversation-platform/ui'
import { formatDate } from '@/lib/utils'
import {
  MessageSquare, Send, Instagram, Globe, Slack, Mail, Smartphone, Puzzle, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from 'lucide-react'

interface ChannelInfo {
  type: string; name: string; status: string; lastActivity: string | null; error: string | null; connectedAt: string | null
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-5 w-5" />,
  telegram: <Send className="h-5 w-5" />,
  messenger: <MessageSquare className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  website: <Globe className="h-5 w-5" />,
  slack: <Slack className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
}

const defaultChannels: ChannelInfo[] = [
  { type: 'whatsapp', name: 'WhatsApp', status: 'connected', lastActivity: '2024-07-06T14:30:00Z', error: null, connectedAt: '2024-01-15T10:30:00Z' },
  { type: 'telegram', name: 'Telegram', status: 'connected', lastActivity: '2024-07-06T12:15:00Z', error: null, connectedAt: '2024-02-20T14:00:00Z' },
  { type: 'messenger', name: 'Messenger', status: 'disconnected', lastActivity: '2024-06-01T11:00:00Z', error: 'Token expired', connectedAt: null },
  { type: 'instagram', name: 'Instagram', status: 'connected', lastActivity: '2024-07-05T09:15:00Z', error: null, connectedAt: '2024-03-10T08:15:00Z' },
  { type: 'website', name: 'Website Widget', status: 'connected', lastActivity: '2024-07-06T14:32:00Z', error: null, connectedAt: '2024-01-01T00:00:00Z' },
  { type: 'slack', name: 'Slack', status: 'error', lastActivity: '2024-07-06T10:00:00Z', error: 'Rate limit exceeded', connectedAt: '2024-04-05T16:45:00Z' },
  { type: 'email', name: 'Email', status: 'connected', lastActivity: '2024-07-06T14:28:00Z', error: null, connectedAt: '2024-01-15T10:30:00Z' },
  { type: 'sms', name: 'SMS', status: 'disconnected', lastActivity: null, error: 'Not configured', connectedAt: null },
]

const statusIcon: Record<string, React.ReactNode> = {
  connected: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  disconnected: <XCircle className="h-4 w-4 text-gray-400" />,
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
}

const statusBadge: Record<string, 'success' | 'danger' | 'warning'> = {
  connected: 'success', disconnected: 'warning', error: 'danger',
}

export default function AdminChannels() {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => { setChannels(defaultChannels); setLoading(false) }, 600)
    return () => clearTimeout(timer)
  }, [])

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Channels" description="View and manage connected messaging channels" />
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} variant="rectangular" height={160} />)}
          </div>
        ) : channels.length === 0 ? (
          <Card className="p-0"><EmptyState icon={<Puzzle className="h-12 w-12" />} title="No channels configured" description="Connect a messaging channel to get started" /></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {channels.map(ch => (
              <Card key={ch.type} className="p-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {channelIcons[ch.type] || <Puzzle className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{ch.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">{ch.type}</CardDescription>
                      </div>
                    </div>
                    {statusIcon[ch.status]}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={statusBadge[ch.status]}>{ch.status}</Badge>
                  </div>
                  {ch.connectedAt && <div className="flex items-center justify-between"><span className="text-gray-500">Connected</span><span className="text-gray-700">{formatDate(ch.connectedAt)}</span></div>}
                  {ch.lastActivity && <div className="flex items-center justify-between"><span className="text-gray-500">Last Activity</span><span className="text-gray-700 text-xs">{formatDate(ch.lastActivity)}</span></div>}
                  {ch.error && <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">{ch.error}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
