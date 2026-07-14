'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Send,
  CheckCheck,
  MessageCircle,
  XCircle,
  Radio,
} from 'lucide-react'

interface ChannelData {
  channels: Array<{
    id: string
    name: string
    type: string
    messages: number
    deliveries: number
    replies: number
    failures: number
    activeConversations: number
  }>
}

function ChannelCard({ channel }: { channel: ChannelData['channels'][0] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-primary/10">
          <Radio className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">{channel.name}</h4>
          <p className="text-xs text-muted-foreground">{channel.type}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Messages</p>
            <p className="font-semibold">{channel.messages.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-muted-foreground">Deliveries</p>
            <p className="font-semibold">{channel.deliveries.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-teal-500" />
          <div>
            <p className="text-xs text-muted-foreground">Replies</p>
            <p className="font-semibold">{channel.replies.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Failures</p>
            <p className="font-semibold">{channel.failures.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Active Conversations: <span className="font-semibold text-foreground">{channel.activeConversations}</span>
        </p>
      </div>
    </div>
  )
}

export default function ChannelAnalyticsPage() {
  const [data, setData] = useState<ChannelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/channels')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Analytics"
        description="Performance metrics across all communication channels"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.channels?.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  )
}
