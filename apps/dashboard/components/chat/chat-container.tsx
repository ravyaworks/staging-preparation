'use client'

import { cn } from '@/lib/utils'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { Button, Card, Skeleton } from '@conversation-platform/ui'
import { MessageSquare, Bot, Code, FileText, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

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

interface ChatContainerProps {
  conversation: Conversation
  onSendMessage: (content: string) => Promise<void>
  className?: string
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'flex-row' : 'flex-row-reverse')}>
          <Skeleton variant="circular" width={32} height={32} />
          <div className={cn('flex flex-col gap-2', i % 2 === 0 ? 'items-start' : 'items-end')}>
            <Skeleton variant="rectangular" width={320} height={60} />
            <Skeleton variant="rectangular" width={200} height={20} />
          </div>
        </div>
      ))}
    </div>
  )
}

function WelcomeScreen({ onStartNew }: { onStartNew: () => void }) {
  const suggestions = [
    { icon: Code, title: 'Write code', description: 'Generate a function or script' },
    { icon: FileText, title: 'Summarize', description: 'Summarize a document or article' },
    { icon: Bot, title: 'Explain', description: 'Explain a complex concept' },
    { icon: MessageSquare, title: 'Brainstorm', description: 'Generate creative ideas' },
  ]

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-2xl w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>

        <h2 className="mb-2 text-2xl font-semibold tracking-tight">How can I help you today?</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Start a conversation with your AI assistant
        </p>

        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.title} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                <button
                  type="button"
                  onClick={onStartNew}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </button>
              </Card>
            )
          })}
        </div>

        <p className="mt-6 text-xs text-muted-foreground/50">
          AI responses are generated and may not always be accurate
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Something went wrong</h3>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-6 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="typing-indicator flex items-center gap-1">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

function generateMockResponse(userMessage: string): string {
  const responses = [
    `That's a great question about "${userMessage.slice(0, 30)}${userMessage.length > 30 ? '...' : ''}". Let me break it down for you.

Here are the key points to consider:

1. **First**, we need to understand the core requirements
2. **Second**, we should evaluate the available options
3. **Third**, implementation strategy matters

> "The best way to predict the future is to create it."

Let me know if you need more details on any of these points!`,
    `I've analyzed your request and here's what I found:

\`\`\`typescript
interface Analysis {
  topic: string
  confidence: number
  suggestions: string[]
}

const result: Analysis = {
      topic: "${userMessage.slice(0, 20)}",
  confidence: 0.95,
  suggestions: ['Option A', 'Option B', 'Option C']
}
\`\`\`

The *main takeaway* here is that we should focus on **clarity** and **simplicity** when approaching this problem.`,
    `Here's my perspective on this:

Based on common patterns and best practices, I'd recommend considering the following approach:

- Start with a **clear definition** of what success looks like
- Break down the problem into *smaller*, manageable pieces
- Iterate based on feedback

The key insight is that *simplicity* is the ultimate sophistication. Let me know if you'd like me to elaborate on any particular aspect.`,
    `Great question! Let me think about this step by step.

**Step 1: Understanding the Context**
First, we need to establish the baseline requirements.

**Step 2: Evaluating Options**
There are several approaches we could take here:
1. The *direct* approach
2. The *scalable* approach
3. The *flexible* approach

**Step 3: Making a Recommendation**
Based on my analysis, I'd suggest going with a hybrid approach that combines the best elements of each option.

> Remember: "Any sufficiently advanced technology is indistinguishable from magic."

Would you like me to dive deeper into any of these areas?`,
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

export function ChatContainer({ conversation, onSendMessage: _onSendMessage, className }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setMessages(conversation.messages)
    setIsLoading(true)
    setError(null)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [conversation.id, conversation.messages])

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom(false)
    }
  }, [messages, isStreaming, scrollToBottom, userScrolledUp])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) { return }
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setUserScrolledUp(!isNearBottom)
  }, [])

  const simulateStreaming = useCallback(async (userMessage: string) => {
    setIsStreaming(true)
    const assistantId = `msg-${Date.now()}`
    setStreamingMessageId(assistantId)

    const fullResponse = generateMockResponse(userMessage)
    let displayedContent = ''

    const words = fullResponse.split(/(?<=\s)/)
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 25))
      displayedContent += words[i]

      const streamingAssistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: displayedContent,
        timestamp: new Date(),
      }

      setMessages((prev) => {
        const exists = prev.find((m) => m.id === assistantId)
        if (exists) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: displayedContent } : m))
        }
        return [...prev, streamingAssistantMsg]
      })

      if (i < words.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    setStreamingMessageId(null)
    setIsStreaming(false)
  }, [])

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) { return }

      setError(null)

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setUserScrolledUp(false)

      try {
        await simulateStreaming(content)
      } catch {
        setError('Failed to send message. Please try again.')
        setIsStreaming(false)
      }
    },
    [isStreaming, simulateStreaming]
  )

  const handleStop = useCallback(() => {
    setIsStreaming(false)
    setStreamingMessageId(null)
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      setMessages((prev) => prev.filter((m) => m.role !== 'assistant' || m.id !== prev[prev.length - 1]?.id))
    }
  }, [messages])

  const hasMessages = messages.length > 0

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : !hasMessages ? (
        <WelcomeScreen onStartNew={() => {}} />
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 sm:px-6"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={msg.id === streamingMessageId}
              />
            ))}

            {isStreaming && !streamingMessageId && <TypingIndicator />}

            {userScrolledUp && hasMessages && (
              <div className="sticky bottom-0 flex justify-center py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUserScrolledUp(false)
                    scrollToBottom(true)
                  }}
                  className="shadow-xs text-xs"
                >
                  <ArrowRight className="mr-1 h-3 w-3 rotate-90" />
                  New messages
                </Button>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        disabled={isLoading}
      />
    </div>
  )
}
