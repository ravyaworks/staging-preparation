'use client'

import { cn } from '@/lib/utils'
import { Send, StopCircle, Paperclip, Sparkles } from 'lucide-react'
import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  isStreaming?: boolean
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}

const MAX_CHARS = 4000
const WARN_CHARS = 3000

export function ChatInput({
  onSend,
  onStop,
  isStreaming = false,
  placeholder = 'Type a message...',
  maxLength = MAX_CHARS,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) {return}
    ta.style.height = 'auto'
    const lineHeight = 24
    const maxHeight = lineHeight * 6 + 16
    const newHeight = Math.min(ta.scrollHeight, maxHeight)
    ta.style.height = `${newHeight}px`
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || disabled || isStreaming) {return}
    onSend(trimmed)
    setInput('')
  }, [input, disabled, isStreaming, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = input.length
  const isNearLimit = charCount >= WARN_CHARS

  return (
    <div className="border-t bg-background px-4 py-3 sm:px-6" role="form">
      <div
        className={cn(
          'relative mx-auto max-w-3xl rounded-2xl border bg-muted/30 transition-all duration-200',
          isFocused && 'border-primary/50 shadow-sm shadow-primary/5',
          isStreaming && 'border-amber-400/50'
        )}
      >
        <div className="flex items-end gap-2 p-2">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
            title="Attach files"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                setInput(e.target.value)
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isStreaming ? 'Waiting for response...' : placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed py-2 max-h-[160px] scrollbar-thin"
            aria-label="Message input"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                input.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted-foreground/10 text-muted-foreground/30 cursor-not-allowed'
              )}
              title="Send message"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/30">
              Enter to send · Shift+Enter for new line
            </span>
          </div>

          {charCount > 0 && (
            <span
              className={cn(
                'text-[10px] transition-colors',
                isNearLimit ? 'text-amber-500' : 'text-muted-foreground/30'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
