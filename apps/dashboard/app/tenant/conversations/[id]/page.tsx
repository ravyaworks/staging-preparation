'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ChatContainer } from '@/components/chat/chat-container'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar'
import { Button, Badge, Dropdown } from '@conversation-platform/ui'
import {
  Settings,
  ChevronDown,
  Download,
  Edit3,
  Check,
  X,
  PanelLeft,
  Sparkles,
  FileText,
  Code,
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

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'claude-3.5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
]

const mockConversation: Conversation = {
  id: 'conv-1',
  title: 'Building a React component library',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful coding assistant with expertise in React, TypeScript, and modern web development.',
  messages: [
    {
      id: 'msg-1',
      role: 'system',
      content: 'Conversation started with GPT-4o',
      timestamp: new Date('2026-07-08T10:00:00'),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'I want to build a React component library. What\'s the best approach?',
      timestamp: new Date('2026-07-08T10:00:30'),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: `Building a React component library is an exciting project! Here's a structured approach:

## 1. Setup & Tooling

First, choose your build tools:

\`\`\`bash
# Using TypeScript + Rollup or tsup
mkdir my-component-library
cd my-component-library
npm init -y
npm install typescript react @types/react
\`\`\`

## 2. Architecture Decisions

- **Component Structure**: Use a flat or nested structure based on scale
- **Styling Solution**: CSS Modules, Tailwind, or CSS-in-JS
- **Build Tool**: tsup, Rollup, or Vite library mode
- **Testing**: Vitest + React Testing Library

## 3. Key Considerations

- *Tree-shaking* support is crucial for bundle size
- **TypeScript** generics for flexible component APIs
- Proper *forwardRef* and *displayName* patterns
- Accessibility (a11y) built-in from the start

Would you like me to elaborate on any of these areas?`,
      timestamp: new Date('2026-07-08T10:01:00'),
    },
    {
      id: 'msg-4',
      role: 'user',
      content: 'Can you show me a Button component example with all the patterns you mentioned?',
      timestamp: new Date('2026-07-08T10:02:00'),
    },
    {
      id: 'msg-5',
      role: 'assistant',
      content: `Here's a production-quality Button component:

\`\`\`typescript
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
  ghost: 'bg-transparent hover:bg-gray-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={\`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 \${variantStyles[variant]} \${sizeStyles[size]} \${className ?? ''}\`.trim()}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
\`\`\`

This covers:
- **forwardRef** for ref forwarding
- **displayName** for debugging
- **Variants & sizes** with TypeScript unions
- **Loading state** with visual feedback
- **Icon slots** for flexibility
- **Proper disabled handling**`,
      timestamp: new Date('2026-07-08T10:03:00'),
    },
  ],
}

const mockConversations = [
  {
    id: 'conv-1',
    title: 'Building a React component library',
    lastMessage: 'Let me break down the architecture for you...',
    updatedAt: new Date('2026-07-08T10:30:00'),
    model: 'GPT-4o',
    messageCount: 12,
  },
  {
    id: 'conv-2',
    title: 'API design best practices',
    lastMessage: 'RESTful APIs should follow these conventions...',
    updatedAt: new Date('2026-07-07T15:45:00'),
    model: 'Claude 3.5',
    messageCount: 8,
  },
  {
    id: 'conv-3',
    title: 'Database schema optimization',
    lastMessage: 'For your use case, I recommend indexing...',
    updatedAt: new Date('2026-07-06T09:15:00'),
    model: 'GPT-4o',
    messageCount: 15,
  },
  {
    id: 'conv-4',
    title: 'Deployment strategy discussion',
    lastMessage: 'A blue-green deployment would minimize downtime...',
    updatedAt: new Date('2026-07-05T14:20:00'),
    model: 'Claude 3.5',
    messageCount: 6,
  },
  {
    id: 'conv-5',
    title: 'Code review: authentication flow',
    lastMessage: 'The JWT implementation looks good, but...',
    updatedAt: new Date('2026-07-04T11:00:00'),
    model: 'GPT-4o',
    messageCount: 22,
  },
]

export default function TenantConversationPage() {
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation>(mockConversation)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(conversation.title)
  const [selectedModel, setSelectedModel] = useState(conversation.model)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(conversation.systemPrompt ?? '')

  const currentModel = models.find((m) => m.id === selectedModel)

  const handleSendMessage = useCallback(async (_content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }, [])

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/tenant/conversations/${id}`)
    },
    [router]
  )

  const handleNewConversation = useCallback(() => {
    router.push('/conversations/new')
  }, [router])

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (id === conversation.id) {
        router.push('/tenant/conversations')
      }
    },
    [conversation.id, router]
  )

  const downloadBlob = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportAsJson = useCallback(() => {
    const data = {
      title: conversation.title,
      model: selectedModel,
      messages: conversation.messages,
      exportedAt: new Date().toISOString(),
    }
    downloadBlob(
      JSON.stringify(data, null, 2),
      `${conversation.title.replace(/\s+/g, '-').toLowerCase()}.json`,
      'application/json'
    )
  }, [conversation, selectedModel, downloadBlob])

  const exportAsText = useCallback(() => {
    const lines = conversation.messages.map((m) =>
      `[${m.role.toUpperCase()}]\n${m.content}`
    )
    downloadBlob(
      lines.join('\n\n---\n\n'),
      `${conversation.title.replace(/\s+/g, '-').toLowerCase()}.txt`,
      'text/plain'
    )
  }, [conversation, downloadBlob])

  const exportAsMarkdown = useCallback(() => {
    const lines = conversation.messages.map((m) => {
      const role = m.role === 'user' ? '**User**' : m.role === 'assistant' ? '**Assistant**' : '**System**'
      return `### ${role}\n\n${m.content}`
    })
    const content = `# ${conversation.title}\n\n${lines.join('\n\n')}`
    downloadBlob(
      content,
      `${conversation.title.replace(/\s+/g, '-').toLowerCase()}.md`,
      'text/markdown'
    )
  }, [conversation, downloadBlob])

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
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>{currentModel?.name ?? 'Select model'}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {showModelDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowModelDropdown(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-lg animate-fade-in">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id)
                            setShowModelDropdown(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-accent ${
                            model.id === selectedModel ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          <div>
                            <p className="text-sm">{model.name}</p>
                            <p className="text-muted-foreground/60">{model.provider}</p>
                          </div>
                          {model.id === selectedModel && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                title="System prompt"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" title="Export conversation">
                    <Download className="h-4 w-4" />
                  </Button>
                }
                align="end"
                items={[
                  { label: 'Export as JSON', onClick: exportAsJson, icon: <Code className="h-4 w-4" /> },
                  { label: 'Export as Text', onClick: exportAsText, icon: <FileText className="h-4 w-4" /> },
                  { label: 'Export as Markdown', onClick: exportAsMarkdown, icon: <FileText className="h-4 w-4" /> },
                ]}
              />
            </div>
          </div>

          {showSystemPrompt && (
            <div className="border-b bg-muted/20 px-4 py-3">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    System Prompt
                  </label>
                  <Badge variant="info" className="text-[10px]">System</Badge>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 scrollbar-thin"
                  placeholder="Enter system instructions for the AI..."
                />
                <p className="mt-1 text-[10px] text-muted-foreground/50">
                  System prompts set the behavior and context for the AI assistant
                </p>
              </div>
            </div>
          )}

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
