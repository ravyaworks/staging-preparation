'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Search, Phone, Mail, Shield, ShieldOff } from 'lucide-react'
import { Button, Card, CardContent, Input, Badge, Skeleton, ErrorState, EmptyState, Select } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate, truncate } from '@/lib/utils'

interface Contact {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  tags: string[]
  conversationCount: number
  lastActivityAt: string | null
  isBlocked: boolean
  createdAt: string
}

const mockContacts: Contact[] = [
  { id: 'c1', name: 'John Doe', phone: '+1234567890', email: 'john@example.com', tags: ['new', 'whatsapp'], conversationCount: 3, lastActivityAt: '2026-07-13T10:30:00Z', isBlocked: false, createdAt: '2026-07-10T08:00:00Z' },
  { id: 'c2', name: 'Sarah Johnson', phone: '+1987654321', email: 'sarah@example.com', tags: ['returning', 'whatsapp'], conversationCount: 8, lastActivityAt: '2026-07-13T09:15:00Z', isBlocked: false, createdAt: '2026-07-05T12:00:00Z' },
  { id: 'c3', name: 'Mike Brown', phone: '+1555123456', email: null, tags: ['new', 'whatsapp'], conversationCount: 1, lastActivityAt: '2026-07-12T22:00:00Z', isBlocked: false, createdAt: '2026-07-12T22:00:00Z' },
  { id: 'c4', name: 'Emily Davis', phone: '+1777888999', email: 'emily@test.com', tags: ['returning', 'whatsapp'], conversationCount: 15, lastActivityAt: '2026-07-12T16:45:00Z', isBlocked: false, createdAt: '2026-06-28T14:00:00Z' },
  { id: 'c5', name: 'David Lee', phone: '+1666555444', email: 'david@example.com', tags: ['vip', 'returning', 'whatsapp'], conversationCount: 42, lastActivityAt: '2026-07-11T14:20:00Z', isBlocked: true, createdAt: '2026-06-15T09:30:00Z' },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setContacts(mockContacts)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = (contacts ?? []).filter((c) => {
    const matchesSearch = !search || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchesTag = !tagFilter || c.tags.includes(tagFilter)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set((contacts ?? []).flatMap(c => c.tags)))
  const tagOptions = [
    { value: '', label: 'All Tags' },
    ...allTags.map(tag => ({ value: tag, label: tag })),
  ]

  if (error) {
    return (
      <div>
        <PageHeader title="Contacts" description="Manage your contacts" />
        <div className="p-6">
          <ErrorState title="Failed to load contacts" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Contacts" description="Manage your contacts" />

      <div className="p-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-1">
                      <Skeleton width="50%" />
                      <Skeleton width="30%" height={12} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No contacts yet"
                description="Contacts will appear here when messages are received."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                options={tagOptions}
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground ml-auto">
                {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                      No contacts match your search.
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filtered.map((contact) => (
                  <Link key={contact.id} href={`/tenant/contacts/${contact.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {contact.name ?? contact.phone ?? 'Unknown'}
                              </span>
                              {contact.isBlocked && (
                                <ShieldOff className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              )}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span className="truncate">{contact.phone}</span>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{contact.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {contact.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="default" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              <span className="text-[10px] text-muted-foreground">
                                {contact.conversationCount} conversations
                              </span>
                            </div>
                            {contact.lastActivityAt && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Last active: {formatDate(contact.lastActivityAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
