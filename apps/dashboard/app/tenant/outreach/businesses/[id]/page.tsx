'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { ArrowLeft, ExternalLink, Copy } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  queued: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  replied: 'bg-purple-100 text-purple-800',
}

export default function BusinessDetailPage() {
  const params = useParams()
  const [business, setBusiness] = useState<any>(null)
  const [trace, setTrace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchBusiness()
  }, [])

  async function fetchBusiness() {
    setLoading(true)
    try {
      const [bizRes, traceRes] = await Promise.all([
        fetch(`/api/v1/outreach/businesses/${params.id}`),
        fetch(`/api/v1/outreach/businesses/${params.id}/traceability`),
      ])
      if (bizRes.ok) {
        const data = await bizRes.json()
        setBusiness(data.data)
      }
      if (traceRes.ok) {
        const data = await traceRes.json()
        setTrace(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  function copyPreviewUrl() {
    if (!business?.previewUrl) return
    navigator.clipboard.writeText(business.previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Business Details" />
        <div className="p-6 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!business) {
    return (
      <div>
        <PageHeader title="Business Details" />
        <div className="p-6 text-muted-foreground">Business not found</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={business.businessName}>
        <Link href="/tenant/outreach/businesses">
          <Badge variant="outline" className="cursor-pointer">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Businesses
          </Badge>
        </Link>
      </PageHeader>

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Business Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{business.businessName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono">{business.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{business.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span>{business.industry || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[business.status] ?? ''}>{business.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span>{business.campaignName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(business.createdAt).toLocaleString()}</span></div>
          </CardContent>
        </Card>

        {business.previewUrl && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Preview URL</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-xs font-mono break-all">
                {business.previewUrl}
              </div>
              <div className="flex gap-2">
                <a href={business.previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={copyPreviewUrl}>
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Personalized Message</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
              {business.personalizedMessage}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Personalized Message</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
              {business.personalizedMessage}
            </div>
          </CardContent>
        </Card>
      </div>

      {trace && (
        <div className="px-6 pb-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Traceability Chain</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Campaign</p>
                  <p className="font-medium text-sm">{trace.campaign?.name ?? '—'}</p>
                  <Badge className={`${statusColors[trace.campaign?.status] ?? ''} mt-1`}>{trace.campaign?.status ?? 'N/A'}</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Outreach Job</p>
                  <p className="font-medium text-sm">{trace.outreachJob?.id ? `${trace.outreachJob.id.substring(0, 8)}...` : '—'}</p>
                  <Badge className={`${statusColors[trace.outreachJob?.status] ?? ''} mt-1`}>{trace.outreachJob?.status ?? 'N/A'}</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Conversation</p>
                  <p className="font-medium text-sm">{trace.conversation?.id ? `${trace.conversation.id.substring(0, 8)}...` : '—'}</p>
                  <Badge className={`${statusColors[trace.conversation?.status] ?? ''} mt-1`}>{trace.conversation?.status ?? 'N/A'}</Badge>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Contact</p>
                  <p className="font-medium text-sm">{trace.contact?.name ?? '—'}</p>
                  <p className="font-mono text-xs text-muted-foreground">{trace.contact?.phone ?? ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
