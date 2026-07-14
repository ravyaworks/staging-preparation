'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@conversation-platform/ui'
import {
  RefreshCw,
  Users,
  UserPlus,
  UserCheck,
  Building2,
  Globe,
} from 'lucide-react'

interface ContactData {
  totalContacts: number
  newContacts: number
  returningContacts: number
  contactSources: Array<{
    source: string
    count: number
    percentage: number
  }>
  industryDistribution: Array<{
    industry: string
    count: number
    percentage: number
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

export default function ContactAnalyticsPage() {
  const [data, setData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/analytics/contacts')
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
        title="Contact Analytics"
        description="Track contact growth and distribution"
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              label="Total Contacts"
              value={data?.totalContacts ?? 0}
              icon={Users}
              color="text-blue-500"
            />
            <StatsCard
              label="New Contacts"
              value={data?.newContacts ?? 0}
              icon={UserPlus}
              color="text-green-500"
            />
            <StatsCard
              label="Returning Contacts"
              value={data?.returningContacts ?? 0}
              icon={UserCheck}
              color="text-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Contact Sources
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Source</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Count</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.contactSources?.map((source, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-3 font-medium">{source.source}</td>
                        <td className="py-3 text-right">{source.count.toLocaleString()}</td>
                        <td className="py-3 text-right">{source.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Distribution
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Industry</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Count</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.industryDistribution?.map((industry, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-3 font-medium">{industry.industry}</td>
                        <td className="py-3 text-right">{industry.count.toLocaleString()}</td>
                        <td className="py-3 text-right">{industry.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
