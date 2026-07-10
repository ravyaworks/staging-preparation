'use client'

import { cn } from '@/lib/utils'
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function renderMarkdown(text: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  let inCodeBlock = false
  let codeContent = ''

  while (i < lines.length) {
    const line = lines[i]

    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <pre key={`code-${i}`} className="my-2 rounded-lg bg-muted-foreground/10 p-3 overflow-x-auto text-sm font-mono">
            <code>{codeContent}</code>
          </pre>
        )
        codeContent = ''
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      i++
      continue
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
      i++
      continue
    }

    if (line.trim() === '') {
      blocks.push(<br key={`br-${i}`} />)
      i++
      continue
    }

    const rendered = renderInlineMarkdown(line)
    blocks.push(
      <p key={`p-${i}`} className="mb-1 last:mb-0">
        {rendered}
      </p>
    )
    i++
  }

  if (inCodeBlock) {
    blocks.push(
      <pre key="code-orphan" className="my-2 rounded-lg bg-muted-foreground/10 p-3 overflow-x-auto text-sm font-mono">
        <code>{codeContent}</code>
      </pre>
    )
  }

  return blocks
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)
    const codeMatch = remaining.match(/`([^`]+)`/)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)

    const matches: { index: number; length: number; type: string; match: RegExpMatchArray }[] = []

    if (boldMatch) {matches.push({ index: boldMatch.index as number, length: boldMatch[0].length, type: 'bold', match: boldMatch })}
    if (italicMatch) {matches.push({ index: italicMatch.index as number, length: italicMatch[0].length, type: 'italic', match: italicMatch })}
    if (codeMatch) {matches.push({ index: codeMatch.index as number, length: codeMatch[0].length, type: 'code', match: codeMatch })}
    if (linkMatch) {matches.push({ index: linkMatch.index as number, length: linkMatch[0].length, type: 'link', match: linkMatch })}

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const earliest = matches[0]

    if (earliest.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>)
    }

    switch (earliest.type) {
      case 'bold':
        parts.push(<strong key={key++}>{earliest.match[1]}</strong>)
        break
      case 'italic':
        parts.push(<em key={key++}>{earliest.match[1]}</em>)
        break
      case 'code':
        parts.push(
          <code key={key++} className="rounded bg-muted-foreground/15 px-1.5 py-0.5 text-sm font-mono">
            {earliest.match[1]}
          </code>
        )
        break
      case 'link':
        parts.push(
          <a key={key++} href={earliest.match[2]} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            {earliest.match[1]}
          </a>
        )
        break
    }

    remaining = remaining.slice(earliest.index + earliest.length)
  }

  return parts
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = message.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const renderedContent = useMemo(() => {
    if (message.role === 'assistant') {
      return renderMarkdown(message.content)
    }
    return message.content
  }, [message.content, message.role])

  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-2" role="log" aria-label="Conversation messages">
        <div className="message-bubble-system text-xs opacity-70">
          <p className="italic">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex gap-3 animate-slide-up',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
      role="log"
      aria-label="Conversation messages"
    >
      <div className="flex-shrink-0 mt-1">
        {message.role === 'assistant' ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className={cn('flex max-w-[75%] flex-col', message.role === 'user' ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2.5',
            message.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            isStreaming && 'animate-pulse'
          )}
          title={formatFullDate(message.timestamp)}
          aria-label={message.role === 'user' ? 'User message' : 'Assistant message'}
        >
          {message.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:leading-relaxed">
              {renderedContent}
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{renderedContent}</p>
          )}

          {isStreaming && (
            <div className="typing-indicator mt-1 flex items-center gap-0.5">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted-foreground/60 px-1">
            {formatTime(message.timestamp)}
          </span>

          <button
            onClick={handleCopy}
            className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
            title="Copy message"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>

          {message.role === 'assistant' && (
            <>
              <button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={cn(
                  'rounded p-1 transition-colors',
                  feedback === 'up'
                    ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'
                )}
                title="Good response"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={cn(
                  'rounded p-1 transition-colors',
                  feedback === 'down'
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted'
                )}
                title="Bad response"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </>
          )}

          <button
            className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
            title="Share"
          >
            <Share2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
