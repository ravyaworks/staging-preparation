'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { ArrowLeft, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  queued: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  retrying: 'bg-orange-100 text-orange-800',
  dead_letter: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function JobDetailsPage() {
  const params = useParams()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJob()
  }, [])

  async function fetchJob() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/delivery/jobs/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setJob(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Job Details" />
        <div className="p-6 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div>
        <PageHeader title="Job Details" />
        <div className="p-6 text-muted-foreground">Job not found</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={`Job: ${job.recipientName}`} description={`${job.recipientPhone}`}>
        <Link href="/tenant/delivery">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={fetchJob}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
            <div className="mt-2 text-sm text-muted-foreground">
              Attempts: {job.attempts}/{job.maxAttempts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.campaignName || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Channel: {job.channel || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
            <div>Processed: {job.processedAt ? new Date(job.processedAt).toLocaleString() : 'N/A'}</div>
            {job.processingDurationMs !== null && (
              <div>Duration: {(job.processingDurationMs / 1000).toFixed(1)}s</div>
            )}
            {job.queueWaitTimeMs !== null && (
              <div>Queue wait: {(job.queueWaitTimeMs / 1000).toFixed(1)}s</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="p-6 pt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted p-3 rounded">{job.personalizedMessage}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded</p>
            ) : (
              <div className="space-y-3">
                  {job.timeline.map((event: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      {i < job.timeline.length - 1 && <div className="w-px h-4 bg-border" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.currentStatus}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.durationFromPreviousMs !== null && (
                        <p className="text-xs text-muted-foreground">
                          +{(event.durationFromPreviousMs / 1000).toFixed(1)}s
                        </p>
                      )}
                      {event.workerId && (
                        <p className="text-xs text-muted-foreground">Worker: {event.workerId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.failures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failures recorded</p>
            ) : (
              <div className="space-y-3">
                {job.failures.map((failure: any) => (
                  <Card key={failure.id} className="border-red-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-100 text-red-800">{failure.errorType}</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">{failure.resolutionStatus}</Badge>
                      </div>
                      <p className="text-sm">{failure.errorMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Retry {failure.retryCount} | {new Date(failure.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
