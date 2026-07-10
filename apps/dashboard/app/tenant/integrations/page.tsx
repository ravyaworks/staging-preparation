'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  Tabs,
  Skeleton,
  ErrorState,
  Dialog,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { ChannelCard } from '@/components/integrations/ChannelCard'
import { ApiKeyList } from '@/components/integrations/ApiKeyList'
import { WebhookList } from '@/components/integrations/WebhookList'
import { UsageStats } from '@/components/integrations/UsageStats'
import { IntegrationLogs } from '@/components/integrations/IntegrationLogs'
import {
  Plus,
  Globe,
  MessageCircle,
  MessageSquare,
  Send,
  Slack,
  Gamepad2,
  Users,
  Mail,
  Smartphone,
} from 'lucide-react'

type ChannelStatus = 'connected' | 'disconnected' | 'error'

interface Channel {
  id: string
  name: string
  type: string
  status: ChannelStatus
  enabled: boolean
  lastActivity: string | null
}

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  status: 'active' | 'revoked'
  created: string
  expires: string | null
  lastUsed: string | null
}

interface WebhookEntry {
  id: string
  url: string
  events: string[]
  enabled: boolean
  lastTriggered: string | null
  secret: string
  lastDeliveryStatus: 'success' | 'failed' | null
}

interface UsageStatsData {
  totalMessages: number
  errors: number
  activeChannels: number
  averageLatency: string
}

interface LogEntry {
  id: string
  channelType: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
  details: string | null
}

const channelIcons: Record<string, React.ReactNode> = {
  website: <Globe className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  messenger: <MessageSquare className="h-5 w-5" />,
  telegram: <Send className="h-5 w-5" />,
  slack: <Slack className="h-5 w-5" />,
  discord: <Gamepad2 className="h-5 w-5" />,
  teams: <Users className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
}

const mockChannels: Channel[] = [
  { id: 'ch-1', name: 'Website', type: 'website', status: 'connected', enabled: true, lastActivity: '2026-07-08T10:30:00Z' },
  { id: 'ch-2', name: 'WhatsApp', type: 'whatsapp', status: 'connected', enabled: true, lastActivity: '2026-07-08T09:15:00Z' },
  { id: 'ch-3', name: 'Messenger', type: 'messenger', status: 'error', enabled: false, lastActivity: '2026-07-07T14:20:00Z' },
  { id: 'ch-4', name: 'Telegram', type: 'telegram', status: 'disconnected', enabled: false, lastActivity: null },
  { id: 'ch-5', name: 'Slack', type: 'slack', status: 'connected', enabled: true, lastActivity: '2026-07-08T08:00:00Z' },
  { id: 'ch-6', name: 'Discord', type: 'discord', status: 'disconnected', enabled: false, lastActivity: null },
  { id: 'ch-7', name: 'Microsoft Teams', type: 'teams', status: 'disconnected', enabled: false, lastActivity: null },
  { id: 'ch-8', name: 'Email', type: 'email', status: 'connected', enabled: true, lastActivity: '2026-07-07T16:45:00Z' },
  { id: 'ch-9', name: 'SMS', type: 'sms', status: 'disconnected', enabled: false, lastActivity: null },
]

const mockApiKeys: ApiKey[] = [
  { id: 'ak-1', name: 'Production API Key', prefix: 'sk_prod_abc', scopes: ['messages:read', 'messages:write', 'conversations:read', 'conversations:write', 'contacts:read'], status: 'active', created: '2026-06-01T00:00:00Z', expires: '2027-06-01T00:00:00Z', lastUsed: '2026-07-08T10:00:00Z' },
  { id: 'ak-2', name: 'Staging API Key', prefix: 'sk_staging_def', scopes: ['messages:read', 'messages:write'], status: 'active', created: '2026-06-15T00:00:00Z', expires: null, lastUsed: '2026-07-07T12:00:00Z' },
  { id: 'ak-3', name: 'Analytics Read Key', prefix: 'sk_analytics_ghi', scopes: ['analytics:read'], status: 'revoked', created: '2026-05-01T00:00:00Z', expires: null, lastUsed: '2026-06-30T00:00:00Z' },
]

const mockWebhooks: WebhookEntry[] = [
  { id: 'wh-1', url: 'https://hooks.example.com/chat-events', events: ['message.created', 'conversation.created'], enabled: true, lastTriggered: '2026-07-08T09:15:00Z', secret: 'whsec_abc123def456', lastDeliveryStatus: 'success' },
  { id: 'wh-2', url: 'https://api.acme.com/webhooks/status', events: ['conversation.updated'], enabled: false, lastTriggered: null, secret: 'whsec_xyz789uvw012', lastDeliveryStatus: null },
  { id: 'wh-3', url: 'https://hooks.example.com/error-logs', events: ['conversation.resolved', 'contact.updated'], enabled: true, lastTriggered: '2026-07-08T07:30:00Z', secret: 'whsec_345rst901efg', lastDeliveryStatus: 'failed' },
]

const mockUsageStats: UsageStatsData = {
  totalMessages: 89234,
  errors: 234,
  activeChannels: 4,
  averageLatency: '1.2s',
}

const channelTypes = ['website', 'whatsapp', 'messenger', 'telegram', 'slack', 'discord', 'teams', 'email', 'sms']

const mockLogs: LogEntry[] = [
  { id: 'log-1', channelType: 'whatsapp', level: 'error', message: 'Failed to send message: Rate limit exceeded', timestamp: '2026-07-08T10:30:00Z', details: 'HTTP 429 - Too many requests. Retry after 60 seconds.' },
  { id: 'log-2', channelType: 'messenger', level: 'error', message: 'Webhook verification failed', timestamp: '2026-07-08T09:45:00Z', details: 'Invalid verify token received from Messenger callback.' },
  { id: 'log-3', channelType: 'slack', level: 'warning', message: 'Slack API returned deprecation warning', timestamp: '2026-07-08T08:20:00Z', details: 'Method users.list will be deprecated on 2026-09-01. Migrate to users.list v2.' },
  { id: 'log-4', channelType: 'website', level: 'info', message: 'Chat widget initialized successfully', timestamp: '2026-07-08T07:00:00Z', details: null },
  { id: 'log-5', channelType: 'email', level: 'error', message: 'SMTP connection refused', timestamp: '2026-07-07T22:15:00Z', details: 'Connection to smtp.example.com:587 timed out after 30 seconds.' },
  { id: 'log-6', channelType: 'whatsapp', level: 'info', message: 'Template message approved', timestamp: '2026-07-07T18:00:00Z', details: 'Template "order_confirmation" approved by WhatsApp.' },
  { id: 'log-7', channelType: 'telegram', level: 'warning', message: 'Bot session expired, reconnecting', timestamp: '2026-07-07T15:30:00Z', details: 'Session token invalid. New session established.' },
  { id: 'log-8', channelType: 'sms', level: 'error', message: 'SMS delivery failed: Invalid phone number', timestamp: '2026-07-07T14:00:00Z', details: 'Recipient number +1234567890 is not a valid mobile number.' },
]

function getChannelIcon(type: string): React.ReactNode {
  return channelIcons[type] ?? <Globe className="h-5 w-5" />
}

function IntegrationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className="space-y-1">
                    <Skeleton width={80} height={14} />
                    <Skeleton width={60} height={12} />
                  </div>
                </div>
                <Skeleton width={36} height={20} />
              </div>
              <Skeleton width={120} height={12} className="mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-4">
          <Skeleton width={200} height={20} />
          <Skeleton width="100%" height={38} />
          <Skeleton width="100%" height={38} />
          <Skeleton width="100%" height={38} />
        </CardContent>
      </Card>
    </div>
  )
}

function ChannelsTab({
  channels,
  onToggle,
  onDisconnect,
  disconnectId,
  onConfirmDisconnect,
  onCancelDisconnect,
}: {
  channels: Channel[]
  onToggle: (id: string) => void
  onDisconnect: (id: string) => void
  disconnectId: string | null
  onConfirmDisconnect: () => void
  onCancelDisconnect: () => void
}) {
  const allChannelTypes = [
    { type: 'website', name: 'Website' },
    { type: 'whatsapp', name: 'WhatsApp' },
    { type: 'messenger', name: 'Messenger' },
    { type: 'telegram', name: 'Telegram' },
    { type: 'slack', name: 'Slack' },
    { type: 'discord', name: 'Discord' },
    { type: 'teams', name: 'Microsoft Teams' },
    { type: 'email', name: 'Email' },
    { type: 'sms', name: 'SMS' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Connected Channels</h3>
          <p className="text-sm text-muted-foreground">Manage your channel integrations.</p>
        </div>
        <Link href="/tenant/integrations/connect">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Connect New
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {allChannelTypes.map((ch) => {
          const channel = channels.find((c) => c.type === ch.type)
          const status = channel?.status ?? 'disconnected'
          const enabled = channel?.enabled ?? false
          const lastActivity = channel?.lastActivity ?? null

          return (
            <ChannelCard
              key={ch.type}
              name={ch.name}
              icon={getChannelIcon(ch.type)}
              status={status}
              enabled={enabled}
              lastActivity={lastActivity}
              onToggle={(_checked) => {
                if (channel) {
                  onToggle(channel.id)
                }
              }}
            />
          )
        })}
      </div>

      {channels.filter((c) => c.status === 'connected' || c.status === 'error').length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {channels.filter((c) => c.status === 'connected' || c.status === 'error').map((ch) => (
                <div key={ch.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      {getChannelIcon(ch.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ch.enabled ? 'Enabled' : 'Disabled'} &middot; {ch.status}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDisconnect(ch.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={disconnectId !== null}
        onClose={onCancelDisconnect}
        title="Disconnect Channel"
        description="Are you sure you want to disconnect this channel? You can reconnect it later."
        footer={
          <>
            <Button variant="outline" onClick={onCancelDisconnect}>Cancel</Button>
            <Button variant="danger" onClick={onConfirmDisconnect}>Disconnect</Button>
          </>
        }
      />
    </div>
  )
}

export default function IntegrationsPage() {
  const [channels, setChannels] = useState<Channel[] | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys)
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(mockWebhooks)
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const [logError, setLogError] = useState<string | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setChannels(mockChannels)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  const refreshLogs = useCallback(() => {
    setLogsLoading(true)
    setLogError(null)
    setTimeout(() => {
      setLogs(mockLogs)
      setLogsLoading(false)
    }, 400)
  }, [])

  const handleChannelToggle = (id: string) => {
    setChannels((prev) =>
      (prev ?? []).map((ch) =>
        ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
      )
    )
  }

  const handleDisconnect = () => {
    if (disconnectId) {
      setChannels((prev) =>
        (prev ?? []).map((ch) =>
          ch.id === disconnectId
            ? { ...ch, status: 'disconnected' as ChannelStatus, enabled: false }
            : ch
        )
      )
      setDisconnectId(null)
    }
  }

  const handleCreateApiKey = (_key: { name: string; scopes: string[]; expires: string | null }) => {
    const newKey: ApiKey = {
      id: `ak-${Date.now()}`,
      name: _key.name,
      prefix: `sk_${Math.random().toString(36).substring(2, 10)}`,
      scopes: _key.scopes,
      status: 'active',
      created: new Date().toISOString(),
      expires: _key.expires,
      lastUsed: null,
    }
    setApiKeys((prev) => [...prev, newKey])
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k))
    )
  }

  const handleToggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    )
  }

  const handleCreateWebhook = (webhook: { url: string; events: string[] }) => {
    const newWebhook: WebhookEntry = {
      id: `wh-${Date.now()}`,
      url: webhook.url,
      events: webhook.events,
      enabled: true,
      lastTriggered: null,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      lastDeliveryStatus: null,
    }
    setWebhooks((prev) => [...prev, newWebhook])
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  const handleRegenerateSecret = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, secret: `whsec_${Math.random().toString(36).substring(2, 15)}` }
          : w
      )
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Integrations" description="Manage your connected channels and integrations" />
        <div className="p-6">
          <ErrorState title="Failed to load integrations" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  if (loading || !channels) {
    return (
      <div>
        <PageHeader title="Integrations" description="Manage your connected channels and integrations" />
        <div className="p-6">
          <IntegrationsSkeleton />
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'channels',
      label: 'Channels',
      content: (
        <ChannelsTab
          channels={channels}
          onToggle={handleChannelToggle}
          onDisconnect={setDisconnectId}
          disconnectId={disconnectId}
          onConfirmDisconnect={handleDisconnect}
          onCancelDisconnect={() => setDisconnectId(null)}
        />
      ),
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      content: (
        <ApiKeyList
          keys={apiKeys}
          onCreate={handleCreateApiKey}
          onRevoke={handleRevokeKey}
        />
      ),
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      content: (
        <WebhookList
          webhooks={webhooks}
          onToggle={handleToggleWebhook}
          onCreate={handleCreateWebhook}
          onDelete={handleDeleteWebhook}
          onRegenerateSecret={handleRegenerateSecret}
        />
      ),
    },
    {
      id: 'usage',
      label: 'Usage',
      content: <UsageStats stats={mockUsageStats} />,
    },
    {
      id: 'logs',
      label: 'Logs',
      content: (
        <IntegrationLogs
          logs={logs}
          channelTypes={channelTypes}
          loading={logsLoading}
          error={logError}
          onRetry={refreshLogs}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Integrations" description="Manage your connected channels and integrations" />
      <div className="p-6">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}
