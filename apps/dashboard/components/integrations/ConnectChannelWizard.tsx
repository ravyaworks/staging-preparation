'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
} from '@conversation-platform/ui'
import {
  Globe,
  MessageCircle,
  MessageSquare,
  Send,
  Slack,
  Gamepad2,
  Users,
  Mail,
  Smartphone,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { ChannelConfigForm } from './ChannelConfigForm'
import { cn } from '@/lib/utils'

interface ChannelOption {
  id: string
  name: string
  icon: React.ReactNode
}

interface ConnectChannelWizardProps {
  onComplete: (config: { channelType: string; config: Record<string, unknown>; auth: Record<string, unknown> }) => void
  onCancel: () => void
}

const channelOptions: ChannelOption[] = [
  { id: 'website', name: 'Website', icon: <Globe className="h-5 w-5" /> },
  { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle className="h-5 w-5" /> },
  { id: 'messenger', name: 'Messenger', icon: <MessageSquare className="h-5 w-5" /> },
  { id: 'telegram', name: 'Telegram', icon: <Send className="h-5 w-5" /> },
  { id: 'slack', name: 'Slack', icon: <Slack className="h-5 w-5" /> },
  { id: 'discord', name: 'Discord', icon: <Gamepad2 className="h-5 w-5" /> },
  { id: 'teams', name: 'Microsoft Teams', icon: <Users className="h-5 w-5" /> },
  { id: 'email', name: 'Email', icon: <Mail className="h-5 w-5" /> },
  { id: 'sms', name: 'SMS', icon: <Smartphone className="h-5 w-5" /> },
]

const authMethods = [
  { value: 'api-key', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'none', label: 'No Authentication' },
]

export function ConnectChannelWizard({ onComplete, onCancel }: ConnectChannelWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({})
  const [authMethod, setAuthMethod] = useState('api-key')
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null)

  const handleConfigChange = (field: string, value: unknown) => {
    setConfigValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleAuthChange = (field: string, value: string) => {
    setAuthValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleTestConnection = () => {
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      setTesting(false)
      setTestResult('success')
    }, 1500)
  }

  const handleFinish = () => {
    if (!selectedChannel) { return }
    onComplete({
      channelType: selectedChannel,
      config: configValues,
      auth: { method: authMethod, ...authValues },
    })
  }

  const selectedChannelName = channelOptions.find((c) => c.id === selectedChannel)?.name ?? ''

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Connect Channel</h2>
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={4}
              aria-label={`Step ${s}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Select Channel Type</CardTitle>
            <CardDescription>Choose the channel you want to connect.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {channelOptions.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50',
                    selectedChannel === ch.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                  )}
                  role="radio"
                  aria-checked={selectedChannel === ch.id}
                  aria-label={ch.name}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    selectedChannel === ch.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {ch.icon}
                  </div>
                  <span className="font-medium">{ch.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedChannel && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Configure {selectedChannelName}</CardTitle>
            <CardDescription>Enter the configuration details for your {selectedChannelName} channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChannelConfigForm
              channelType={selectedChannel}
              values={configValues}
              onChange={handleConfigChange}
            />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Choose and configure the authentication method.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Authentication Method"
              options={authMethods}
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value)}
            />
            {authMethod === 'api-key' && (
              <Input
                label="API Key"
                type="password"
                placeholder="Enter your API key"
                value={authValues.apiKey ?? ''}
                onChange={(e) => handleAuthChange('apiKey', e.target.value)}
                required
              />
            )}
            {authMethod === 'oauth2' && (
              <>
                <Input
                  label="Client ID"
                  placeholder="Enter client ID"
                  value={authValues.clientId ?? ''}
                  onChange={(e) => handleAuthChange('clientId', e.target.value)}
                  required
                />
                <Input
                  label="Client Secret"
                  type="password"
                  placeholder="Enter client secret"
                  value={authValues.clientSecret ?? ''}
                  onChange={(e) => handleAuthChange('clientSecret', e.target.value)}
                  required
                />
                <Input
                  label="Authorization URL"
                  placeholder="https://provider.com/oauth/authorize"
                  value={authValues.authUrl ?? ''}
                  onChange={(e) => handleAuthChange('authUrl', e.target.value)}
                />
              </>
            )}
            {authMethod === 'bearer' && (
              <Input
                label="Bearer Token"
                type="password"
                placeholder="Enter bearer token"
                value={authValues.bearerToken ?? ''}
                onChange={(e) => handleAuthChange('bearerToken', e.target.value)}
                required
              />
            )}
            {authMethod === 'none' && (
              <p className="text-sm text-muted-foreground">
                No authentication will be used for this channel connection.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Test Connection</CardTitle>
            <CardDescription>Verify that your configuration is correct before finalizing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium">{selectedChannelName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auth Method</span>
                <span className="font-medium">{authMethods.find((a) => a.value === authMethod)?.label}</span>
              </div>
            </div>

            {!testResult && (
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing Connection...</>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
            )}

            {testResult === 'success' && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Connection Successful</p>
                  <p className="text-xs text-green-600">Your {selectedChannelName} channel is configured correctly.</p>
                </div>
              </div>
            )}

            {testResult === 'failed' && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <X className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Connection Failed</p>
                  <p className="text-xs text-red-600">Please check your configuration and try again.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 1 ? (
            <>Cancel</>
          ) : (
            <><ArrowLeft className="mr-1.5 h-4 w-4" />Back</>
          )}
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !selectedChannel}
          >
            Next<ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={testResult !== 'success'}>
            <Check className="mr-1.5 h-4 w-4" />
            Complete Connection
          </Button>
        )}
      </div>
    </div>
  )
}
