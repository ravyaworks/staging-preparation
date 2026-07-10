'use client'

import { Input, Select, Toggle } from '@conversation-platform/ui'

interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'password' | 'number' | 'select' | 'toggle'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

interface ChannelConfigFormProps {
  channelType: string
  values: Record<string, unknown>
  onChange: (field: string, value: unknown) => void
}

const channelFields: Record<string, FieldDefinition[]> = {
  website: [
    { name: 'widgetId', label: 'Widget ID', type: 'text', required: true, placeholder: 'e.g. wgt_abc123' },
    { name: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'https://example.com' },
    { name: 'position', label: 'Widget Position', type: 'select', required: true, options: [{ value: 'right', label: 'Bottom Right' }, { value: 'left', label: 'Bottom Left' }] },
    { name: 'primaryColor', label: 'Primary Color', type: 'text', required: false, placeholder: '#2563eb' },
  ],
  whatsapp: [
    { name: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true, placeholder: 'e.g. 123456789' },
    { name: 'businessAccountId', label: 'Business Account ID', type: 'text', required: true, placeholder: 'e.g. 987654321' },
    { name: 'appSecret', label: 'App Secret', type: 'password', required: true, placeholder: 'Enter app secret' },
  ],
  messenger: [
    { name: 'pageId', label: 'Page ID', type: 'text', required: true, placeholder: 'e.g. 123456789' },
    { name: 'verifyToken', label: 'Verify Token', type: 'password', required: true, placeholder: 'Enter verify token' },
    { name: 'greetingText', label: 'Greeting Text', type: 'text', required: false, placeholder: 'Hi! How can we help you?' },
  ],
  telegram: [
    { name: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'e.g. 123456:ABC-DEF1234' },
    { name: 'botUsername', label: 'Bot Username', type: 'text', required: true, placeholder: 'e.g. my_company_bot' },
  ],
  slack: [
    { name: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'e.g. 12345.67890' },
    { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Enter client secret' },
    { name: 'signingSecret', label: 'Signing Secret', type: 'password', required: true, placeholder: 'Enter signing secret' },
  ],
  discord: [
    { name: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'e.g. MTIzNDU2Nzg5MDEyMzQ1Njc4OQ' },
    { name: 'guildId', label: 'Server/Guild ID', type: 'text', required: false, placeholder: 'e.g. 123456789012345678' },
  ],
  teams: [
    { name: 'appId', label: 'App ID', type: 'text', required: true, placeholder: 'e.g. 12345678-1234-1234-1234-123456789012' },
    { name: 'appPassword', label: 'App Password', type: 'password', required: true, placeholder: 'Enter app password' },
    { name: 'tenantId', label: 'Tenant ID', type: 'text', required: false, placeholder: 'e.g. 12345678-1234-1234-1234-123456789012' },
  ],
  email: [
    { name: 'smtpHost', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.example.com' },
    { name: 'smtpPort', label: 'SMTP Port', type: 'number', required: true, placeholder: '587' },
    { name: 'smtpUsername', label: 'SMTP Username', type: 'text', required: true, placeholder: 'user@example.com' },
    { name: 'smtpPassword', label: 'SMTP Password', type: 'password', required: true, placeholder: 'Enter password' },
    { name: 'imapHost', label: 'IMAP Host', type: 'text', required: true, placeholder: 'imap.example.com' },
  ],
  sms: [
    { name: 'provider', label: 'SMS Provider', type: 'select', required: true, options: [{ value: 'twilio', label: 'Twilio' }, { value: 'vonage', label: 'Vonage' }, { value: 'plivo', label: 'Plivo' }] },
    { name: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'e.g. ACxxxxxxxxxxxxxxxx' },
    { name: 'authToken', label: 'Auth Token', type: 'password', required: true, placeholder: 'Enter auth token' },
    { name: 'fromNumber', label: 'From Number', type: 'text', required: true, placeholder: '+1234567890' },
  ],
}

export function ChannelConfigForm({ channelType, values, onChange }: ChannelConfigFormProps) {
  const fields = channelFields[channelType] ?? []

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No configuration required for this channel type.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <Select
              key={field.name}
              label={field.label}
              options={field.options ?? []}
              value={(values[field.name] as string) ?? ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
          )
        }
        if (field.type === 'toggle') {
          return (
            <Toggle
              key={field.name}
              label={field.label}
              checked={(values[field.name] as boolean) ?? false}
              onChange={(checked) => onChange(field.name, checked)}
            />
          )
        }
        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            value={(values[field.name] as string) ?? ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      })}
    </div>
  )
}
