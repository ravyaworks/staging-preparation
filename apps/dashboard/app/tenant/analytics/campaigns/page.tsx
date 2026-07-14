'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Megaphone,
  Zap,
  CheckCircle,
  TrendingUp,
  Target,
  Calendar,
} from 'lucide-react'

interface CampaignData {
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  successRate: number
  recentActivity: Array<{
    id: string
    name: string
    status: string
    sent: number
    delivered: number
    replies: number
    createdAt: string
  }>
  topPerformers: Array<{
    id: string
    name: string
    successRate: number
    totalSent: number
    replies: number
  }>
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

export default function CampaignAnalyticsPage() {
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/campaigns')
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
        title="Campaign Analytics"
        description="Track campaign performance and engagement metrics"
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
              label="Total Campaigns"
              value={data?.totalCampaigns ?? 0}
              icon={Megaphone}
              color="text-blue-500"
            />
            <StatsCard
              label="Active Campaigns"
              value={data?.activeCampaigns ?? 0}
              icon={Zap}
              color="text-green-500"
            />
            <StatsCard
              label="Completed Campaigns"
              value={data?.completedCampaigns ?? 0}
              icon={CheckCircle}
              color="text-emerald-500"
            />
            <StatsCard
              label="Success Rate"
              value={`${(data?.successRate ?? 0).toFixed(1)}%`}
              icon={TrendingUp}
              color="text-purple-500"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Campaign Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Campaign</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Sent</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Delivered</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Replies</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentActivity?.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{campaign.name}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-50 text-green-700'
                              : campaign.status === 'completed'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">{campaign.sent.toLocaleString()}</td>
                      <td className="py-3 text-right">{campaign.delivered.toLocaleString()}</td>
                      <td className="py-3 text-right">{campaign.replies.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performing Campaigns
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Campaign</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Success Rate</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Total Sent</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Replies</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topPerformers?.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{campaign.name}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`font-medium ${
                            campaign.successRate >= 80
                              ? 'text-green-600'
                              : campaign.successRate >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {campaign.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">{campaign.totalSent.toLocaleString()}</td>
                      <td className="py-3 text-right">{campaign.replies.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
