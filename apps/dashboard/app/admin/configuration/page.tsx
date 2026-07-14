'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Button, Input, Toggle, Skeleton, ErrorState,
} from '@conversation-platform/ui'
import { Save, Server, Gauge, Brain, Radio, Timer, RotateCcw } from 'lucide-react'

interface ConfigSection {
  key: string; title: string; description: string; icon: React.ReactNode; fields: { key: string; label: string; type: 'text' | 'number' | 'toggle'; value: string | number | boolean }[]
}

const configSections: ConfigSection[] = [
  {
    key: 'queue', title: 'Queue Configuration', description: 'Job queue processing settings', icon: <Server className="h-5 w-5" />,
    fields: [
      { key: 'maxRetries', label: 'Max Retries', type: 'number', value: 3 },
      { key: 'retryDelayMs', label: 'Retry Delay (ms)', type: 'number', value: 5000 },
      { key: 'concurrency', label: 'Concurrency', type: 'number', value: 10 },
    ],
  },
  {
    key: 'scheduler', title: 'Scheduler Configuration', description: 'Job scheduling parameters', icon: <Gauge className="h-5 w-5" />,
    fields: [
      { key: 'pollIntervalMs', label: 'Poll Interval (ms)', type: 'number', value: 5000 },
      { key: 'maxBatchSize', label: 'Max Batch Size', type: 'number', value: 100 },
    ],
  },
  {
    key: 'rateLimits', title: 'Rate Limits', description: 'API and service rate limiting', icon: <Timer className="h-5 w-5" />,
    fields: [
      { key: 'api', label: 'API (requests/min)', type: 'number', value: 100 },
      { key: 'auth', label: 'Auth (requests/15min)', type: 'number', value: 20 },
      { key: 'webhook', label: 'Webhook (requests/min)', type: 'number', value: 30 },
      { key: 'message', label: 'Message (requests/min)', type: 'number', value: 200 },
    ],
  },
  {
    key: 'ai', title: 'AI Configuration', description: 'AI model and generation settings', icon: <Brain className="h-5 w-5" />,
    fields: [
      { key: 'defaultModel', label: 'Default Model', type: 'text', value: 'gpt-4' },
      { key: 'maxTokens', label: 'Max Tokens', type: 'number', value: 2048 },
      { key: 'temperature', label: 'Temperature', type: 'number', value: 0.7 },
    ],
  },
  {
    key: 'channels', title: 'Channel Configuration', description: 'Default channel delivery settings', icon: <Radio className="h-5 w-5" />,
    fields: [
      { key: 'defaultProvider', label: 'Default Provider', type: 'text', value: 'whatsapp' },
      { key: 'retryAttempts', label: 'Retry Attempts', type: 'number', value: 3 },
    ],
  },
  {
    key: 'retry', title: 'Retry Policies', description: 'Retry and backoff configuration', icon: <RotateCcw className="h-5 w-5" />,
    fields: [
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', value: 3 },
      { key: 'backoffBase', label: 'Backoff Base (ms)', type: 'number', value: 1000 },
      { key: 'backoffMultiplier', label: 'Backoff Multiplier', type: 'number', value: 2 },
    ],
  },
]

export default function AdminConfiguration() {
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, Record<string, string | number | boolean>>>({})
  const [savedSection, setSavedSection] = useState<string | null>(null)

  useEffect(() => {
    const initial: Record<string, Record<string, string | number | boolean>> = {}
    for (const section of configSections) {
      initial[section.key] = {}
      for (const field of section.fields) {
        initial[section.key][field.key] = field.value
      }
    }
    setValues(initial)
    setLoading(false)
  }, [])

  const updateField = (section: string, key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }

  const handleSave = (section: string) => {
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2000)
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Configuration" description="Manage platform configuration settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        {configSections.map(section => (
          <Card key={section.key} className="p-0">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">{section.icon}</div>
                <div className="flex-1"><CardTitle>{section.title}</CardTitle><CardDescription>{section.description}</CardDescription></div>
              </div>
            </CardHeader>
            {loading ? (
              <CardContent><div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} variant="text" width="70%" />)}</div></CardContent>
            ) : (
              <CardContent>
                <div className="space-y-4">
                  {section.fields.map(field => (
                    field.type === 'toggle' ? (
                      <Toggle key={field.key} label={field.label} checked={!!values[section.key]?.[field.key]} onChange={v => updateField(section.key, field.key, v)} />
                    ) : (
                      <Input key={field.key} label={field.label} type={field.type} value={String(values[section.key]?.[field.key] ?? '')} onChange={e => {
                        const val = field.type === 'number' ? Number(e.target.value) : e.target.value
                        updateField(section.key, field.key, val)
                      }} />
                    )
                  ))}
                </div>
              </CardContent>
            )}
            <CardFooter className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{savedSection === section.key ? 'Changes saved successfully' : 'Unsaved changes'}</span>
              <Button size="sm" onClick={() => handleSave(section.key)} disabled={loading}><Save className="h-3.5 w-3.5" /> Save</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
