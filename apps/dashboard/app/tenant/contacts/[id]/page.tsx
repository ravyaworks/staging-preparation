'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Shield, ShieldOff, MessageSquare, Calendar, Tag } from 'lucide-react'
import { Button, Card, CardContent, Badge, Skeleton, ErrorState } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate } from '@/lib/utils'

interface ContactDetail {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  avatarUrl: string | null
  tags: string[]
  channels: Array<{ type: string; id: string; addedAt: string }>
  conversationCount: number
  lastActivityAt: string | null
  isBlocked: boolean
  notes: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

const mockContact: ContactDetail = {
  id: 'c1',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  avatarUrl: null,
  tags: ['new', 'whatsapp', 'premium-lead'],
  channels: [{ type: 'whatsapp', id: '+1234567890', addedAt: '2026-07-10T08:00:00Z' }],
  conversationCount: 3,
  lastActivityAt: '2026-07-13T10:30:00Z',
  isBlocked: false,
  notes: 'Interested in premium plan. Follow up with pricing details.',
  metadata: { campaignSource: 'website-widget' },
  createdAt: '2026-07-10T08:00:00Z',
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blocking, setBlocking] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setContact(mockContact)
      setLoading(false)
    }, 600)
  }, [params.id])

  useEffect(() => { load() }, [load])

  const handleToggleBlock = () => {
    setBlocking(true)
    setTimeout(() => {
      setContact((prev) => prev ? { ...prev, isBlocked: !prev.isBlocked } : null)
      setBlocking(false)
    }, 400)
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Contact" description="View contact details" />
        <div className="p-6">
          <ErrorState title="Failed to load contact" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={contact?.name ?? 'Contact'}
        description="Contact details and activity"
      >
        <Button size="sm" variant="outline" onClick={() => router.push('/tenant/contacts')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <div className="p-6">
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton width="60%" />
                    <Skeleton width="40%" height={12} />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Skeleton width="40%" />
                  <Skeleton width="80%" height={12} />
                  <Skeleton width="60%" height={12} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : !contact ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Contact not found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mt-2">{contact.name ?? 'Unknown'}</h2>
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </p>
                    )}
                    {contact.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant={contact.isBlocked ? 'outline' : 'danger'}
                      onClick={handleToggleBlock}
                      isLoading={blocking}
                    >
                      {contact.isBlocked ? (
                        <><Shield className="mr-1.5 h-4 w-4" />Unblock</>
                      ) : (
                        <><ShieldOff className="mr-1.5 h-4 w-4" />Block</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push('/tenant/inbox')}>
                      <MessageSquare className="mr-1.5 h-4 w-4" />
                      View Conversations
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Conversations</span>
                    <span className="text-sm">{contact.conversationCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Last Active</span>
                    <span className="text-xs">{contact.lastActivityAt ? formatDate(contact.lastActivityAt) : 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Created</span>
                    <span className="text-xs">{formatDate(contact.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={contact.isBlocked ? 'danger' : 'success'}>
                      {contact.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channels</p>
                  {contact.channels.map((ch) => (
                    <div key={ch.type} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{ch.type}</span>
                      <span className="text-xs text-muted-foreground">{ch.id}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Notes & Activity */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm">{contact.notes ?? 'No notes available.'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {JSON.stringify(contact.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Conversations</p>
                  <div className="space-y-2">
                    <Link href="/tenant/inbox/conversations/1" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">Product inquiry - pricing and plans</p>
                        <p className="text-xs text-muted-foreground">Active &middot; 12 messages</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate('2026-07-13T10:30:00Z')}</span>
                    </Link>
                    <Link href="/tenant/inbox/conversations/2" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">Follow up - trial experience</p>
                        <p className="text-xs text-muted-foreground">Resolved &middot; 8 messages</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate('2026-07-11T14:20:00Z')}</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
