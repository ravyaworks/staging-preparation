'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { ConnectChannelWizard } from '@/components/integrations/ConnectChannelWizard'
import { Check, ArrowLeft, Globe, MessageCircle, MessageSquare, Send, Slack, Gamepad2, Users, Mail, Smartphone } from 'lucide-react'

const channelIcons: Record<string, React.ReactNode> = {
  website: <Globe className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  messenger: <MessageSquare className="h-5 w-5" />,
  telegram: <Send className="h-5 w-5" />,
  slack: <Slack className="h-5 w-5" />,
  discord: <Gamepad2 className="h-5 w-5" />,
  teams: <Users className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
}

const channelNames: Record<string, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
  telegram: 'Telegram',
  slack: 'Slack',
  discord: 'Discord',
  teams: 'Microsoft Teams',
  email: 'Email',
  sms: 'SMS',
}

interface ConnectionResult {
  channelType: string
  config: Record<string, unknown>
  auth: Record<string, unknown>
}

export default function ConnectChannelPage() {
  const router = useRouter()
  const [completed, setCompleted] = useState<ConnectionResult | null>(null)

  const handleComplete = useCallback((result: ConnectionResult) => {
    setCompleted(result)
  }, [])

  const handleBack = useCallback(() => {
    router.push('/tenant/integrations')
  }, [router])

  if (completed) {
    const name = channelNames[completed.channelType] ?? completed.channelType
    return (
      <div>
        <PageHeader title="Connect Channel" description="Channel connection setup" />
        <div className="p-6">
          <Card className="mx-auto max-w-lg bg-card border-border">
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Channel Connected!</CardTitle>
                <CardDescription>
                  Your {name} channel has been successfully configured and connected.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    {channelIcons[completed.channelType]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <Badge variant="success">Connected</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Auth method: {completed.auth.method as string}</p>
                </div>
              </div>
              <Button onClick={handleBack} className="w-full">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Connect Channel" description="Set up a new channel integration" />
      <div className="p-6">
        <ConnectChannelWizard onComplete={handleComplete} onCancel={handleBack} />
      </div>
    </div>
  )
}
