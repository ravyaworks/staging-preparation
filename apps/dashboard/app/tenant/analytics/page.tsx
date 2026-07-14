'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Building2,
  Megaphone,
  Zap,
  MessageSquare,
  Send,
  CheckCheck,
  Mail,
  Users,
  UserCheck,
  Phone,
  MessageCircle,
} from 'lucide-react'

interface OverviewData {
  totalOrganizations: number
  totalCampaigns: number
  activeCampaigns: number
  totalBusinesses: number
  totalConversations: number
  activeConversations: number
  messagesSent: number
  messagesDelivered: number
  messagesRead: number
  customerReplies: number
  openLeads: number
  closedLeads: number
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: any
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />}
      </div>
      <p className="text-2xl font-bold mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/overview')
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
        title="Analytics Overview"
        description="Executive dashboard with key metrics across your platform"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Organizations"
              value={data?.totalOrganizations ?? 0}
              icon={Building2}
              color="text-blue-500"
            />
            <StatsCard
              label="Total Campaigns"
              value={data?.totalCampaigns ?? 0}
              icon={Megaphone}
              color="text-purple-500"
            />
            <StatsCard
              label="Active Campaigns"
              value={data?.activeCampaigns ?? 0}
              icon={Zap}
              color="text-green-500"
            />
            <StatsCard
              label="Total Businesses"
              value={data?.totalBusinesses ?? 0}
              icon={Users}
              color="text-orange-500"
            />
            <StatsCard
              label="Total Conversations"
              value={data?.totalConversations ?? 0}
              icon={MessageSquare}
              color="text-blue-500"
            />
            <StatsCard
              label="Active Conversations"
              value={data?.activeConversations ?? 0}
              icon={MessageCircle}
              color="text-green-500"
            />
            <StatsCard
              label="Messages Sent"
              value={data?.messagesSent ?? 0}
              icon={Send}
              color="text-indigo-500"
            />
            <StatsCard
              label="Messages Delivered"
              value={data?.messagesDelivered ?? 0}
              icon={CheckCheck}
              color="text-green-500"
            />
            <StatsCard
              label="Messages Read"
              value={data?.messagesRead ?? 0}
              icon={Mail}
              color="text-teal-500"
            />
            <StatsCard
              label="Customer Replies"
              value={data?.customerReplies ?? 0}
              icon={Phone}
              color="text-cyan-500"
            />
            <StatsCard
              label="Open Leads"
              value={data?.openLeads ?? 0}
              icon={UserCheck}
              color="text-amber-500"
            />
            <StatsCard
              label="Closed Leads"
              value={data?.closedLeads ?? 0}
              icon={UserCheck}
              color="text-red-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
