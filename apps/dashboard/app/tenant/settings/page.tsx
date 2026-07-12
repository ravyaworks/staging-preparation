'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowUpDown,
  BarChart3,
  HardDrive,
  Users,
  MessageSquare,
  Webhook,
  Plus,
  Key,
  Copy,
  Check,
  Activity,
  Upload,
  Eye,
  Download,
  CreditCard,
  AlertTriangle,
  Save,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  Toggle,
  Dialog,
  Tabs,
  Skeleton,
  Progress,
  ErrorState,
  Badge,
  Textarea,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { formatBytes, formatDate } from '@/lib/utils'

interface TenantSettings {
  name: string
  slug: string
  domain: string
  logoUrl: string
}

interface ConversationDefaults {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

interface SecuritySettings {
  sessionTimeout: number
  mfaEnabled: boolean
}

interface BillingInfo {
  plan: string
  status: string
  conversationsUsed: number
  conversationsLimit: number
  messagesThisMonth: number
  nextBilling: string
  amount: string
}

interface UsageStats {
  apiCallsUsed: number
  apiCallsLimit: number
  storageBytesUsed: number
  storageBytesLimit: number
  activeUsers: number
  activeUsersLimit: number
  conversationsTotal: number
}

interface PaymentMethod {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface Invoice {
  id: string
  date: string
  amount: string
  status: 'paid' | 'pending' | 'overdue'
  description: string
}

interface Webhook {
  id: string
  url: string
  events: string[]
  enabled: boolean
  lastTriggered: string | null
  secret: string
}

interface WebhookDelivery {
  id: string
  webhookId: string
  status: 'success' | 'failed'
  timestamp: string
  responseCode: number
}

interface BrandingSettings {
  logo: string | null
  primaryColor: string
  customCss: string
}

const mockSettings: TenantSettings = {
  name: 'Acme Corp',
  slug: 'acme-corp',
  domain: 'acme.example.com',
  logoUrl: 'https://example.com/logo.png',
}

const mockDefaults: ConversationDefaults = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are a helpful assistant for Acme Corp. Be professional, concise, and accurate.',
}

const mockSecurity: SecuritySettings = {
  sessionTimeout: 60,
  mfaEnabled: false,
}

const mockBilling: BillingInfo = {
  plan: 'Enterprise',
  status: 'active',
  conversationsUsed: 128,
  conversationsLimit: 1000,
  messagesThisMonth: 4356,
  nextBilling: '2026-08-01',
  amount: '$499/mo',
}

const mockUsageStats: UsageStats = {
  apiCallsUsed: 45230,
  apiCallsLimit: 100000,
  storageBytesUsed: 2.4 * 1024 * 1024 * 1024,
  storageBytesLimit: 10 * 1024 * 1024 * 1024,
  activeUsers: 16,
  activeUsersLimit: 50,
  conversationsTotal: 128,
}

const mockPaymentMethod: PaymentMethod = {
  brand: 'Visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2028,
}

const mockInvoices: Invoice[] = [
  { id: 'inv-001', date: '2026-07-01', amount: '$499.00', status: 'paid', description: 'Enterprise Plan - July 2026' },
  { id: 'inv-002', date: '2026-06-01', amount: '$499.00', status: 'paid', description: 'Enterprise Plan - June 2026' },
  { id: 'inv-003', date: '2026-05-01', amount: '$499.00', status: 'paid', description: 'Enterprise Plan - May 2026' },
  { id: 'inv-004', date: '2026-04-01', amount: '$499.00', status: 'paid', description: 'Enterprise Plan - April 2026' },
]

const mockWebhooks: Webhook[] = [
  { id: 'wh-1', url: 'https://hooks.example.com/chat-events', events: ['message.created', 'conversation.created'], enabled: true, lastTriggered: '2026-07-08T09:15:00Z', secret: 'whsec_abc123def456' },
  { id: 'wh-2', url: 'https://api.acme.com/webhooks/status', events: ['conversation.updated'], enabled: false, lastTriggered: null, secret: 'whsec_xyz789uvw012' },
]

const eventOptions = [
  { value: 'message.created', label: 'Message Created' },
  { value: 'message.updated', label: 'Message Updated' },
  { value: 'conversation.created', label: 'Conversation Created' },
  { value: 'conversation.updated', label: 'Conversation Updated' },
  { value: 'conversation.resolved', label: 'Conversation Resolved' },
]

const mockDeliveries: WebhookDelivery[] = [
  { id: 'del-1', webhookId: 'wh-1', status: 'success', timestamp: '2026-07-08T09:15:00Z', responseCode: 200 },
  { id: 'del-2', webhookId: 'wh-1', status: 'success', timestamp: '2026-07-08T08:30:00Z', responseCode: 200 },
  { id: 'del-3', webhookId: 'wh-1', status: 'failed', timestamp: '2026-07-08T07:45:00Z', responseCode: 500 },
]

const mockBranding: BrandingSettings = {
  logo: null,
  primaryColor: '#2563eb',
  customCss: '',
}

const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3.5', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
]

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton width={140} />
            <Skeleton width={220} height={14} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton width={80} height={12} />
                <Skeleton height={38} />
              </div>
              <div className="space-y-2">
                <Skeleton width={80} height={12} />
                <Skeleton height={38} />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={12} />
              <Skeleton height={38} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function GeneralTab({ settings, onUpdate }: { settings: TenantSettings; onUpdate: (s: TenantSettings) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Basic tenant information and branding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tenant name" value={settings.name} onChange={(e) => onUpdate({ ...settings, name: e.target.value })} />
          <Input label="Slug" value={settings.slug} onChange={(e) => onUpdate({ ...settings, slug: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Domain" value={settings.domain} onChange={(e) => onUpdate({ ...settings, domain: e.target.value })} placeholder="your-domain.com" />
          <Input label="Logo URL" value={settings.logoUrl} onChange={(e) => onUpdate({ ...settings, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
        </div>
        <div className="flex justify-end pt-2">
          <Button size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ConversationTab({ defaults, onUpdate }: { defaults: ConversationDefaults; onUpdate: (d: ConversationDefaults) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Conversation Defaults</CardTitle>
        <CardDescription>Default settings for new conversations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Default model"
            options={modelOptions}
            value={defaults.model}
            onChange={(e) => onUpdate({ ...defaults, model: e.target.value })}
          />
          <Input
            label="Temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={defaults.temperature}
            onChange={(e) => onUpdate({ ...defaults, temperature: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Max tokens"
            type="number"
            min={256}
            max={32768}
            step={256}
            value={defaults.maxTokens}
            onChange={(e) => onUpdate({ ...defaults, maxTokens: parseInt(e.target.value) || 2048 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">System prompt</label>
          <textarea
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
            value={defaults.systemPrompt}
            onChange={(e) => onUpdate({ ...defaults, systemPrompt: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityTab({ security, onUpdate }: { security: SecuritySettings; onUpdate: (s: SecuritySettings) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Manage authentication and session settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Session timeout (minutes)"
            type="number"
            min={5}
            max={480}
            value={security.sessionTimeout}
            onChange={(e) => onUpdate({ ...security, sessionTimeout: parseInt(e.target.value) || 60 })}
          />
        </div>
        <Toggle
          label="Multi-factor authentication"
          description="Require MFA for all team members."
          checked={security.mfaEnabled}
          onChange={(checked) => onUpdate({ ...security, mfaEnabled: checked })}
        />
        <div className="flex justify-end pt-2">
          <Button size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BillingTab({ billing }: { billing: BillingInfo }) {
  const [showPlanMsg, setShowPlanMsg] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details and usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{billing.plan} Plan</p>
              <p className="text-sm text-muted-foreground">{billing.amount}</p>
            </div>
            <Badge variant="success">{billing.status}</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Conversations</span>
                <span className="font-medium">{billing.conversationsUsed} / {billing.conversationsLimit}</span>
              </div>
              <Progress value={(billing.conversationsUsed / billing.conversationsLimit) * 100} variant="default" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Messages this month</span>
                <span className="font-medium">{billing.messagesThisMonth.toLocaleString()}</span>
              </div>
              <Progress value={65} variant="warning" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowPlanMsg('upgrade')}>
              <ArrowUpDown className="mr-1.5 h-4 w-4" />
              Upgrade Plan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowPlanMsg('downgrade')}>
              <ArrowUpDown className="mr-1.5 h-4 w-4" />
              Downgrade Plan
            </Button>
          </div>

          {showPlanMsg && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Plan changes are coming soon. You will be able to upgrade or downgrade your plan here.
              <button onClick={() => setShowPlanMsg(null)} className="ml-2 text-primary hover:underline">
                Dismiss
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Next billing date</span>
            <span className="font-medium">{billing.nextBilling}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Your resource usage this billing period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span>API Calls</span>
              </div>
              <p className="text-lg font-semibold">{mockUsageStats.apiCallsUsed.toLocaleString()} / {mockUsageStats.apiCallsLimit.toLocaleString()}</p>
              <Progress value={(mockUsageStats.apiCallsUsed / mockUsageStats.apiCallsLimit) * 100} variant="default" className="mt-2" />
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <HardDrive className="h-4 w-4" />
                <span>Storage</span>
              </div>
              <p className="text-lg font-semibold">{formatBytes(mockUsageStats.storageBytesUsed)} / {formatBytes(mockUsageStats.storageBytesLimit)}</p>
              <Progress value={(mockUsageStats.storageBytesUsed / mockUsageStats.storageBytesLimit) * 100} variant="default" className="mt-2" />
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span>Active Users</span>
              </div>
              <p className="text-lg font-semibold">{mockUsageStats.activeUsers} / {mockUsageStats.activeUsersLimit}</p>
              <Progress value={(mockUsageStats.activeUsers / mockUsageStats.activeUsersLimit) * 100} variant="warning" className="mt-2" />
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                <span>Conversations</span>
              </div>
              <p className="text-lg font-semibold">{mockUsageStats.conversationsTotal}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Your default payment method.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{mockPaymentMethod.brand} ending in {mockPaymentMethod.last4}</p>
              <p className="text-xs text-muted-foreground">Expires {mockPaymentMethod.expMonth}/{mockPaymentMethod.expYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>View and download past invoices.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm">{formatDate(inv.date)}</TableCell>
                  <TableCell className="text-sm">{inv.description}</TableCell>
                  <TableCell className="text-sm font-medium">{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'danger'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [newEvents, setNewEvents] = useState<string[]>([])

  const handleToggle = (id: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w))
  }

  const handleDelete = () => {
    if (deleteId) {
      setWebhooks((prev) => prev.filter((w) => w.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleCopy = async (secret: string, id: string) => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard not available
    }
  }

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const handleCreate = () => {
    if (!newUrl) { return }
    const newWebhook: Webhook = {
      id: `wh-${Date.now()}`,
      url: newUrl,
      events: newEvents,
      enabled: true,
      lastTriggered: null,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
    }
    setWebhooks((prev) => [...prev, newWebhook])
    setNewUrl('')
    setNewEvents([])
    setShowCreateDialog(false)
  }

  const deliveriesForWebhook = (webhookId: string) =>
    mockDeliveries.filter((d) => d.webhookId === webhookId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks</h3>
          <p className="text-sm text-muted-foreground">Manage webhook endpoints for real-time events.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Webhook
        </Button>
      </div>

      {webhooks.map((wh) => (
        <Card key={wh.id} className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base truncate">{wh.url}</CardTitle>
                <CardDescription>
                  {wh.events.join(', ')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Toggle
                  checked={wh.enabled}
                  onChange={() => handleToggle(wh.id)}
                />
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(wh.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">
                {wh.secret}
              </code>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(wh.secret, wh.id)}>
                {copiedId === wh.id ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Recent Deliveries</p>
              {deliveriesForWebhook(wh.id).length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent deliveries.</p>
              ) : (
                <div className="space-y-1">
                  {deliveriesForWebhook(wh.id).map((del) => (
                    <div key={del.id} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <Activity className={`h-3.5 w-3.5 ${del.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-muted-foreground">{formatDate(del.timestamp)}</span>
                      <Badge variant={del.status === 'success' ? 'success' : 'danger'} className="text-[10px]">
                        {del.status}
                      </Badge>
                      <span className="text-muted-foreground">HTTP {del.responseCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {webhooks.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Webhook className="h-12 w-12" />}
              title="No webhooks yet"
              description="Create your first webhook endpoint to receive real-time events."
            />
          </CardContent>
        </Card>
      )}

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create Webhook"
        description="Set up a new webhook endpoint to receive events."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newUrl}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Endpoint URL"
            placeholder="https://example.com/webhook"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Events</label>
            <div className="space-y-2">
              {eventOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newEvents.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                    className="rounded border-border"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      />
    </div>
  )
}

function BrandingTab() {
  const [branding, setBranding] = useState<BrandingSettings>(mockBranding)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize the look and feel of your tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                {branding.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logo} alt="Logo" className="h-16 w-16 object-contain" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  Upload Logo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setBranding((prev) => ({ ...prev, logo: url }))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border border-border"
                />
                <Input
                  placeholder="#2563eb"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Custom CSS</label>
            <Textarea
              placeholder="/* Add custom CSS rules here */"
              value={branding.customCss}
              onChange={(e) => setBranding((prev) => ({ ...prev, customCss: e.target.value }))}
              rows={6}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Custom CSS will be applied to your tenant&apos;s interface.
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="mr-1.5 h-4 w-4" />
              Preview Branding
            </Button>
            <Button size="sm" variant="outline">
              <Save className="mr-1.5 h-4 w-4" />
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Branding Preview"
        description="Preview how your branding will look."
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
        }
      >
        <div className="space-y-4">
          <div
            className="rounded-lg border border-border p-6"
            style={{ backgroundColor: `${branding.primaryColor}10` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: branding.primaryColor }}>
                  Branded Header
                </p>
                <p className="text-xs text-muted-foreground">Your custom branding preview</p>
              </div>
            </div>
            <div
              className="rounded-md px-4 py-2 text-sm text-white inline-block"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Primary Button
            </div>
            <div
              className="mt-2 rounded-md border px-4 py-2 text-sm inline-block ml-2"
              style={{ borderColor: branding.primaryColor, color: branding.primaryColor }}
            >
              Outline Button
            </div>
          </div>
          {branding.customCss && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Custom CSS applied</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">{branding.customCss}</pre>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}

function DangerTab() {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Irreversible actions that affect your entire tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-red-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Delete tenant</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Permanently delete your tenant and all associated data. This cannot be undone.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Tenant
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete tenant"
        description="This will permanently delete Acme Corp and all of its conversations, knowledge items, workflows, and team members. Are you absolutely sure?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setShowConfirm(false)}>Permanently Delete</Button>
          </>
        }
      />
    </Card>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [defaults, setDefaults] = useState<ConversationDefaults | null>(null)
  const [security, setSecurity] = useState<SecuritySettings | null>(null)
  const [billing] = useState<BillingInfo>(mockBilling)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setSettings(mockSettings)
      setDefaults(mockDefaults)
      setSecurity(mockSecurity)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  if (error) {
    return (
      <div>
        <PageHeader title="Settings" description="Manage your tenant settings" />
        <div className="p-6">
          <ErrorState title="Failed to load settings" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  if (loading || !settings || !defaults || !security) {
    return (
      <div>
        <PageHeader title="Settings" description="Manage your tenant settings" />
        <div className="p-6">
          <SettingsSkeleton />
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: <GeneralTab settings={settings} onUpdate={setSettings} />,
    },
    {
      id: 'conversation',
      label: 'Conversation Defaults',
      content: <ConversationTab defaults={defaults} onUpdate={setDefaults} />,
    },
    {
      id: 'security',
      label: 'Security',
      content: <SecurityTab security={security} onUpdate={setSecurity} />,
    },
    {
      id: 'billing',
      label: 'Billing',
      content: <BillingTab billing={billing} />,
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      content: <WebhooksTab />,
    },
    {
      id: 'branding',
      label: 'Branding',
      content: <BrandingTab />,
    },
  ]

  return (
    <div>
      <PageHeader title="Settings" description="Manage your tenant settings" />
      <div className="p-6">
        <Tabs tabs={tabs} />
        <div className="mt-6">
          <DangerTab />
        </div>
      </div>
    </div>
  )
}
