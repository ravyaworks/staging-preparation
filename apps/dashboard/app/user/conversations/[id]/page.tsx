'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ChatContainer } from '@/components/chat/chat-container'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar'
import { Button } from '@conversation-platform/ui'
import {
  PanelLeft,
  Edit3,
  Check,
  X,
  Download,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface Conversation {
  id: string
  title: string
  model: string
  systemPrompt?: string
  messages: Message[]
}

const mockConversation: Conversation = {
  id: 'conv-1',
  title: 'Getting started with the platform',
  model: 'gpt-4o',
  messages: [
    {
      id: 'msg-1',
      role: 'system',
      content: 'Welcome! How can I help you today?',
      timestamp: new Date('2026-07-08T09:00:00'),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'Hi! I just signed up and I want to understand how the conversation platform works.',
      timestamp: new Date('2026-07-08T09:00:30'),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: `Welcome to the platform! Let me give you a quick overview:

## Key Features

1. **Multi-tenant Architecture** - Organizations can manage their own AI-powered conversations
2. **Smart Conversations** - Natural, context-aware interactions with AI assistants
3. **Knowledge Base** - Upload documents and training materials
4. **Analytics** - Track conversation performance and user satisfaction

## Getting Started

Here's what you can do right now:

- *Start a new conversation* using the chat interface
- *Explore the dashboard* to see available features
- *Customize your settings* in the user preferences

The platform is designed to be **intuitive** and **powerful**. Feel free to ask any questions!`,
      timestamp: new Date('2026-07-08T09:01:00'),
    },
    {
      id: 'msg-4',
      role: 'user',
      content: 'Can I integrate this with my existing tools?',
      timestamp: new Date('2026-07-08T09:02:00'),
    },
    {
      id: 'msg-5',
      role: 'assistant',
      content: `Absolutely! Here are the integration options:

## Available Integrations

- **REST API** - Full CRUD operations for conversations and messages
- **Webhook Support** - Real-time event notifications
- **Widget Embed** - Drop-in chat widget for your website
- **Slack Integration** - Connect conversations to your Slack workspace

\`\`\`javascript
// Example: API call to create a conversation
const response = await fetch('https://api.example.com/v1/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'My Conversation' })
});
\`\`\`

Would you like detailed documentation for any of these integrations?`,
      timestamp: new Date('2026-07-08T09:03:00'),
    },
  ],
}

const mockConversations = [
  {
    id: 'conv-1',
    title: 'Getting started with the platform',
    lastMessage: 'Absolutely! Here are the integration options...',
    updatedAt: new Date('2026-07-08T09:03:00'),
    model: 'GPT-4o',
    messageCount: 5,
  },
  {
    id: 'conv-2',
    title: 'Billing inquiry',
    lastMessage: 'Your current plan includes...',
    updatedAt: new Date('2026-07-07T14:30:00'),
    model: 'GPT-4o',
    messageCount: 3,
  },
  {
    id: 'conv-3',
    title: 'Feature request: Dark mode',
    lastMessage: 'Thank you for the suggestion! Dark mode is...',
    updatedAt: new Date('2026-07-06T11:15:00'),
    model: 'GPT-4o Mini',
    messageCount: 4,
  },
]

export default function UserConversationPage() {
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation>(mockConversation)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(conversation.title)

  const handleSendMessage = useCallback(async (_content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }, [])

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/user/conversations/${id}`)
    },
    [router]
  )

  const handleNewConversation = useCallback(() => {
    router.push('/conversations/new')
  }, [router])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (id === conversation.id) {
        router.push('/user/conversations')
      }
    },
    [conversation.id, router]
  )

  const handleExport = useCallback(() => {
    const data = {
      title: conversation.title,
      messages: conversation.messages,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${conversation.title.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [conversation])

  return (
    <DashboardLayout>
      <div className="flex h-full">
        <ConversationSidebar
          conversations={mockConversations}
          currentConversationId={conversation.id}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b bg-background px-4 py-2.5">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  title="Open sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingTitle(false)
                          setConversation((prev) => ({ ...prev, title }))
                        }
                        if (e.key === 'Escape') {
                          setIsEditingTitle(false)
                          setTitle(conversation.title)
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setIsEditingTitle(false)
                        setConversation((prev) => ({ ...prev, title }))
                      }}
                      className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTitle(false)
                        setTitle(conversation.title)
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-medium">{conversation.title}</h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleExport} title="Export conversation">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatContainer
              conversation={conversation}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
