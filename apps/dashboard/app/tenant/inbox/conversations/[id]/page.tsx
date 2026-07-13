'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Phone, Mail, MoreHorizontal, UserPlus, UserX, XCircle, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button, Card, CardContent, Input, Badge, Skeleton, ErrorState, Select, Dialog } from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  content: string
  direction: string
  messageType: string
  role: string
  status: string
  createdAt: string
  provider?: string
  model?: string
}

interface ConversationDetail {
  id: string
  title: string | null
  status: string
  priority: string
  channel: string
  isAiEnabled: boolean
  isHumanHandoff: boolean
  messageCount: number
  contact: { id: string; name: string | null; phone: string | null; email: string | null; avatarUrl: string | null } | null
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null
  messages: Message[]
  lastMessageAt: string | null
}

const mockMessages: Message[] = [
  { id: 'm1', content: 'Hi, I am interested in your premium plan pricing. Can you tell me more about what is included?', direction: 'inbound', messageType: 'text', role: 'user', status: 'delivered', createdAt: '2026-07-13T10:30:00Z' },
  { id: 'm2', content: 'Hello! Thank you for reaching out. Our premium plan includes unlimited conversations, advanced analytics, custom integrations, dedicated support, and AI-powered responses. Would you like me to go over the pricing details?', direction: 'outbound', messageType: 'text', role: 'assistant', status: 'sent', createdAt: '2026-07-13T10:30:05Z', provider: 'openai', model: 'gpt-4o' },
  { id: 'm3', content: 'That sounds great! Yes, please share the pricing details. Also, do you offer a free trial?', direction: 'inbound', messageType: 'text', role: 'user', status: 'delivered', createdAt: '2026-07-13T10:32:00Z' },
  { id: 'm4', content: 'Our premium plan is priced at $99/month per agent, with annual billing discounts available. And yes, we offer a 14-day free trial with full access to all premium features. Would you like me to help you start the trial?', direction: 'outbound', messageType: 'text', role: 'assistant', status: 'sent', createdAt: '2026-07-13T10:32:08Z', provider: 'openai', model: 'gpt-4o' },
]

const mockConversation: ConversationDetail = {
  id: '1',
  title: 'Product inquiry - pricing and plans',
  status: 'active',
  priority: 'high',
  channel: 'whatsapp',
  isAiEnabled: true,
  isHumanHandoff: false,
  messageCount: 12,
  contact: { id: 'c1', name: 'John Doe', phone: '+1234567890', email: 'john@example.com', avatarUrl: null },
  assignedTo: null,
  messages: mockMessages,
  lastMessageAt: '2026-07-13T10:32:08Z',
}

const statusColor: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  waiting: 'warning',
  resolved: 'info',
  closed: 'default',
}

const priorityColor: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'default',
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assignUserId, setAssignUserId] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setConversation(mockConversation)
      setLoading(false)
    }, 600)
  }, [params.id])

  useEffect(() => { load() }, [load])

  const handleSend = () => {
    if (!newMessage.trim()) return
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setNewMessage('')
    }, 500)
  }

  const handleAssign = () => {
    if (!assignUserId) return
    setConversation((prev) => prev ? {
      ...prev,
      assignedTo: { id: assignUserId, firstName: 'Agent', lastName: 'User', email: 'agent@example.com' },
      isAiEnabled: false,
      isHumanHandoff: true,
    } : null)
    setShowAssignDialog(false)
  }

  const handleRelease = () => {
    setConversation((prev) => prev ? {
      ...prev,
      assignedTo: null,
      isAiEnabled: true,
      isHumanHandoff: false,
    } : null)
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Conversation" description="View conversation details" />
        <div className="p-6">
          <ErrorState title="Failed to load conversation" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={conversation?.contact?.name ?? 'Conversation'}
        description={conversation?.contact?.phone ?? ''}
      >
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push('/tenant/inbox')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </div>
      </PageHeader>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton width="60%" />
                <Skeleton width="80%" height={12} />
                <Skeleton width="40%" height={12} />
              </CardContent>
            </Card>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <div className="flex-1">
                  <Skeleton width="80%" height={40} />
                </div>
              </div>
            ))}
          </div>
        ) : !conversation ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              Conversation not found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar - Contact Info */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.contact?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{conversation.contact?.phone}</p>
                    </div>
                  </div>
                  {conversation.contact?.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{conversation.contact.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={statusColor[conversation.status]}>{conversation.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Priority</span>
                    <Badge variant={priorityColor[conversation.priority]}>{conversation.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Channel</span>
                    <span className="text-xs capitalize">{conversation.channel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">AI Enabled</span>
                    <Badge variant={conversation.isAiEnabled ? 'success' : 'default'}>{conversation.isAiEnabled ? 'Yes' : 'No'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Messages</span>
                    <span className="text-xs">{conversation.messageCount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent</p>
                  {conversation.assignedTo ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {conversation.assignedTo.firstName} {conversation.assignedTo.lastName}
                      </span>
                      <Button size="sm" variant="ghost" onClick={handleRelease}>
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setShowAssignDialog(true)}>
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      Assign to Agent
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main - Messages */}
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {conversation.messages.map((msg) => (
                      <div key={msg.id} className={`p-4 ${msg.direction === 'inbound' ? 'bg-muted/30' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.direction === 'inbound' ? 'bg-primary/10' : 'bg-accent'}`}>
                            {msg.direction === 'inbound' ? (
                              <Phone className="h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {msg.direction === 'inbound' ? conversation.contact?.name ?? 'Contact' : 'AI Assistant'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{formatDate(msg.createdAt)}</span>
                              {msg.model && (
                                <Badge variant="default" className="text-[10px] px-1 py-0">{msg.model}</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground capitalize">{msg.messageType}</span>
                              <span className={`text-[10px] ${msg.status === 'delivered' || msg.status === 'sent' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {msg.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reply Box */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  className="flex-1"
                />
                <Button onClick={handleSend} isLoading={sending} disabled={!newMessage.trim()}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        title="Assign Conversation"
        description="Select an agent to assign this conversation to."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignUserId}>Assign</Button>
          </>
        }
      >
        <div className="space-y-2">
          <Select
            options={[
              { value: 'u1', label: 'Alex Chen' },
              { value: 'u2', label: 'Sam Wilson' },
              { value: 'u3', label: 'Jordan Lee' },
            ]}
            value={assignUserId}
            onChange={(e: any) => setAssignUserId(e.target.value)}
            placeholder="Select an agent..."
          />
        </div>
      </Dialog>
    </div>
  )
}
