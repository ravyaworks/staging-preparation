'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, Badge } from '@conversation-platform/ui'
import {
  Bot,
  Code,
  FileText,
  MessageSquare,
  Sparkles,
  Check,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'Recommended' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'claude-3.5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
]

const suggestions = [
  {
    icon: Code,
    title: 'Write a Python script',
    description: 'Generate a script to process CSV data',
    prompt: 'Write a Python script that reads a CSV file, processes the data, and generates a summary report',
  },
  {
    icon: FileText,
    title: 'Summarize a document',
    description: 'Get key points from long text',
    prompt: 'Please summarize the following text and extract the key points',
  },
  {
    icon: Bot,
    title: 'Explain a concept',
    description: 'Break down complex topics',
    prompt: 'Explain [concept] in simple terms with examples',
  },
  {
    icon: MessageSquare,
    title: 'Brainstorm ideas',
    description: 'Generate creative solutions',
    prompt: 'Help me brainstorm ideas for',
  },
  {
    icon: Code,
    title: 'Debug my code',
    description: 'Find and fix issues',
    prompt: 'I have this code that is not working correctly. Can you help me debug it?',
  },
  {
    icon: FileText,
    title: 'Write documentation',
    description: 'Generate API docs or README',
    prompt: 'Write comprehensive documentation for',
  },
]

export default function NewConversationPage() {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const currentModel = models.find((m) => m.id === selectedModel)

  const handleSend = useCallback(
    (_content: string) => {
      const newId = `conv-${Date.now()}`
      router.push(`/user/conversations/${newId}`)
    },
    [router]
  )

  const handleSuggestion = useCallback(
    (_prompt: string) => {
      const newId = `conv-${Date.now()}`
      router.push(`/user/conversations/${newId}`)
    },
    [router]
  )

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b bg-background px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-sm font-medium">New Conversation</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{currentModel?.name}</span>
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
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm">{model.name}</p>
                          <p className="text-muted-foreground/60">{model.provider}</p>
                        </div>
                        {model.badge && (
                          <Badge variant="info" className="text-[10px]">{model.badge}</Badge>
                        )}
                      </div>
                      {model.id === selectedModel && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-2xl w-full px-6 py-12">
            <div className="text-center mb-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold tracking-tight">Start a new conversation</h2>
              <p className="text-sm text-muted-foreground">
                Choose a model and start chatting with your AI assistant
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                Suggested prompts
              </p>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((s) => {
                  const Icon = s.icon
                  return (
                    <Card
                      key={s.title}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => handleSuggestion(s.prompt)}
                        className="flex w-full items-start gap-3 p-4 text-left"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                      </button>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-background px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-2xl border bg-muted/30">
              <div className="flex items-end gap-2 p-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                      e.preventDefault()
                      handleSend(inputValue.trim())
                    }
                  }}
                  placeholder="Type your message to start the conversation..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/40 max-h-[160px] scrollbar-thin"
                />
                <button
                  type="button"
                  onClick={() => handleSend(inputValue.trim())}
                  disabled={!inputValue.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted-foreground/10 disabled:text-muted-foreground/30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/30">
              Enter to send &middot; Shift+Enter for new line &middot; Using {currentModel?.name}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
