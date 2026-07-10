'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Toggle, Skeleton, ErrorState,
} from '@conversation-platform/ui'
import {
  Save, Globe, Shield, Puzzle, Mail,
} from 'lucide-react'

interface GeneralSettings {
  platformName: string
  supportEmail: string
  platformUrl: string
}

interface SecuritySettings {
  minPasswordLength: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

interface FeatureSettings {
  allowPublicRegistration: boolean
  enableAuditLogging: boolean
  enableAnalytics: boolean
  enableApiAccess: boolean
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  fromAddress: string
  useTls: boolean
}

const defaultGeneral: GeneralSettings = {
  platformName: 'Conversation Platform',
  supportEmail: 'support@example.com',
  platformUrl: 'https://app.example.com',
}

const defaultSecurity: SecuritySettings = {
  minPasswordLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
}

const defaultFeatures: FeatureSettings = {
  allowPublicRegistration: false,
  enableAuditLogging: true,
  enableAnalytics: true,
  enableApiAccess: true,
}

const defaultEmail: EmailSettings = {
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: 'notifications@example.com',
  smtpPassword: '••••••••••••',
  fromAddress: 'noreply@example.com',
  useTls: true,
}

function SectionCard({
  title,
  description,
  icon,
  loading,
  saved,
  onSave,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  loading: boolean
  saved: boolean
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="p-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {loading ? (
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="text" width="70%" />
            ))}
          </div>
        </CardContent>
      ) : (
        <CardContent>{children}</CardContent>
      )}
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {saved ? 'Changes saved successfully' : 'Unsaved changes'}
        </span>
        <Button size="sm" onClick={onSave} disabled={loading}>
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral)
  const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity)
  const [features, setFeatures] = useState<FeatureSettings>(defaultFeatures)
  const [email, setEmail] = useState<EmailSettings>(defaultEmail)

  const [savedSection, setSavedSection] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = (section: string) => {
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2000)
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load settings" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Platform Settings" description="Configure global platform settings" />

      <div className="p-6 space-y-6 max-w-3xl">
        <SectionCard
          title="General"
          description="Basic platform information"
          icon={<Globe className="h-5 w-5" />}
          loading={loading}
          saved={savedSection === 'general'}
          onSave={() => handleSave('general')}
        >
          <div className="space-y-4">
            <Input
              label="Platform Name"
              value={general.platformName}
              onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
            />
            <Input
              label="Support Email"
              type="email"
              value={general.supportEmail}
              onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
            />
            <Input
              label="Platform URL"
              value={general.platformUrl}
              onChange={(e) => setGeneral({ ...general, platformUrl: e.target.value })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Security"
          description="Password policy and session configuration"
          icon={<Shield className="h-5 w-5" />}
          loading={loading}
          saved={savedSection === 'security'}
          onSave={() => handleSave('security')}
        >
          <div className="space-y-4">
            <Input
              label="Minimum Password Length"
              type="number"
              value={String(security.minPasswordLength)}
              onChange={(e) => setSecurity({ ...security, minPasswordLength: parseInt(e.target.value) || 8 })}
            />
            <Toggle
              label="Require Special Characters"
              description="Passwords must include at least one special character"
              checked={security.requireSpecialChars}
              onChange={(v) => setSecurity({ ...security, requireSpecialChars: v })}
            />
            <Toggle
              label="Require Numbers"
              description="Passwords must include at least one number"
              checked={security.requireNumbers}
              onChange={(v) => setSecurity({ ...security, requireNumbers: v })}
            />
            <Input
              label="Session Timeout (minutes)"
              type="number"
              value={String(security.sessionTimeout)}
              onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 60 })}
            />
            <Input
              label="Max Login Attempts"
              type="number"
              value={String(security.maxLoginAttempts)}
              onChange={(e) => setSecurity({ ...security, maxLoginAttempts: parseInt(e.target.value) || 5 })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Features"
          description="Enable or disable platform features"
          icon={<Puzzle className="h-5 w-5" />}
          loading={loading}
          saved={savedSection === 'features'}
          onSave={() => handleSave('features')}
        >
          <div className="space-y-4">
            <Toggle
              label="Allow Public Registration"
              description="Allow new users to register without an invite"
              checked={features.allowPublicRegistration}
              onChange={(v) => setFeatures({ ...features, allowPublicRegistration: v })}
            />
            <Toggle
              label="Audit Logging"
              description="Track all administrative actions"
              checked={features.enableAuditLogging}
              onChange={(v) => setFeatures({ ...features, enableAuditLogging: v })}
            />
            <Toggle
              label="Analytics"
              description="Collect and display platform analytics"
              checked={features.enableAnalytics}
              onChange={(v) => setFeatures({ ...features, enableAnalytics: v })}
            />
            <Toggle
              label="API Access"
              description="Allow tenants to use the public API"
              checked={features.enableApiAccess}
              onChange={(v) => setFeatures({ ...features, enableApiAccess: v })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Email"
          description="SMTP configuration for outgoing emails"
          icon={<Mail className="h-5 w-5" />}
          loading={loading}
          saved={savedSection === 'email'}
          onSave={() => handleSave('email')}
        >
          <div className="space-y-4">
            <Input
              label="SMTP Host"
              value={email.smtpHost}
              onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
            />
            <Input
              label="SMTP Port"
              type="number"
              value={String(email.smtpPort)}
              onChange={(e) => setEmail({ ...email, smtpPort: parseInt(e.target.value) || 587 })}
            />
            <Input
              label="SMTP Username"
              value={email.smtpUsername}
              onChange={(e) => setEmail({ ...email, smtpUsername: e.target.value })}
            />
            <Input
              label="SMTP Password"
              type="password"
              value={email.smtpPassword}
              onChange={(e) => setEmail({ ...email, smtpPassword: e.target.value })}
            />
            <Input
              label="From Address"
              type="email"
              value={email.fromAddress}
              onChange={(e) => setEmail({ ...email, fromAddress: e.target.value })}
            />
            <Toggle
              label="Use TLS"
              description="Encrypt SMTP connections using TLS"
              checked={email.useTls}
              onChange={(v) => setEmail({ ...email, useTls: v })}
            />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
