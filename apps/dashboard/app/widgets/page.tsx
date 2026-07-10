'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { Select } from '@conversation-platform/ui'
import { Toggle } from '@conversation-platform/ui'

import { cn } from '@/lib/utils'
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  Zap,
} from 'lucide-react'

interface WidgetConfig {
  name: string
  themeColor: string
  position: string
  greetingMessage: string
  launcherStyle: string
  primaryColor: string
  font: string
  cornerRadius: number
  darkMode: boolean
  showBrand: boolean
  autoOpenDelay: number
  offlineMessage: string
  csatSurvey: boolean
  fileUpload: boolean
}

const initialConfig: WidgetConfig = {
  name: 'Support Widget',
  themeColor: '#3b82f6',
  position: 'bottom-right',
  greetingMessage: 'Hi there! How can I help you today?',
  launcherStyle: 'bubble',
  primaryColor: '#3b82f6',
  font: 'Inter',
  cornerRadius: 12,
  darkMode: false,
  showBrand: true,
  autoOpenDelay: 5,
  offlineMessage: 'We are offline. Please leave a message.',
  csatSurvey: true,
  fileUpload: true,
}

const steps = [
  { id: 1, label: 'Configure' },
  { id: 2, label: 'Appearance' },
  { id: 3, label: 'Behavior' },
  { id: 4, label: 'Preview' },
  { id: 5, label: 'Embed' },
]

const launcherStyles = [
  { value: 'bubble', label: 'Bubble' },
  { value: 'tab', label: 'Tab' },
  { value: 'button', label: 'Button' },
  { value: 'icon', label: 'Icon' },
]

const positions = [
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
]

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'System', label: 'System UI' },
  { value: 'Serif', label: 'Serif' },
  { value: 'Mono', label: 'Monospace' },
]

function generateEmbedCode(config: WidgetConfig) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return `<!-- Conversation Platform Widget -->
<script src="${baseUrl}/api/v1/widgets/${config.name.toLowerCase().replace(/\s+/g, '-')}/script"></script>`
}

function WidgetPreview({ config }: { config: WidgetConfig }) {
  return (
    <div className="relative mx-auto bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl overflow-hidden" style={{ width: 320, height: 640 }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-700 rounded-b-2xl z-10" />
      <div className="h-full bg-white flex flex-col">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Support</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
              <p className="text-sm text-gray-700">{config.greetingMessage}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%]">
              <p className="text-sm">I need help with my order</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%]">
              <p className="text-sm">Sure, let me look that up for you!</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none"
              readOnly
            />
            <button className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      {config.launcherStyle === 'bubble' && (
        <div
          className="absolute bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: config.primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  )
}

export default function WidgetBuilder() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<WidgetConfig>(initialConfig)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const updateConfig = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const embedCode = generateEmbedCode(config)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <PageHeader title="Widget Builder" description="Create and customize your chat widget">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4" />
            Publish Widget
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 flex gap-6">
        <div className={cn('flex-1 space-y-6', showPreview ? 'max-w-3xl' : 'max-w-5xl')}>
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(s.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    step === s.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    step === s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  )}>
                    {s.id}
                  </span>
                  {s.label}
                </button>
                {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          <Card>
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Configure Widget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Widget Name</label>
                      <Input
                        value={config.name}
                        onChange={(e) => updateConfig('name', e.target.value)}
                        placeholder="My Support Widget"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                      <div className="flex gap-2">
                        <Input
                          value={config.themeColor}
                          onChange={(e) => updateConfig('themeColor', e.target.value)}
                          placeholder="#3b82f6"
                        />
                        <input
                          type="color"
                          value={config.themeColor}
                          onChange={(e) => updateConfig('themeColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <Select
                        value={config.position}
                        onChange={(e) => updateConfig('position', e.target.value)}
                        options={positions}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Launcher Style</label>
                      <Select
                        value={config.launcherStyle}
                        onChange={(e) => updateConfig('launcherStyle', e.target.value)}
                        options={launcherStyles}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
                    <textarea
                      value={config.greetingMessage}
                      onChange={(e) => updateConfig('greetingMessage', e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Customize Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                      <div className="flex gap-2">
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        />
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => updateConfig('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                      <Select
                        value={config.font}
                        onChange={(e) => updateConfig('font', e.target.value)}
                        options={fonts}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corner Radius: {config.cornerRadius}px
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={config.cornerRadius}
                      onChange={(e) => updateConfig('cornerRadius', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <Toggle
                      checked={config.darkMode}
                      onChange={(v) => updateConfig('darkMode', v)}
                      label="Dark Mode"
                      description="Enable dark theme for the widget"
                    />
                    <Toggle
                      checked={config.showBrand}
                      onChange={(v) => updateConfig('showBrand', v)}
                      label="Show Branding"
                      description="Display 'Powered by Conversation Platform'"
                    />
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Configure Behavior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-Open Delay: {config.autoOpenDelay}s
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={config.autoOpenDelay}
                      onChange={(e) => updateConfig('autoOpenDelay', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-400 mt-1">Widget will auto-open after this delay (0 to disable)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offline Message</label>
                    <textarea
                      value={config.offlineMessage}
                      onChange={(e) => updateConfig('offlineMessage', e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Toggle
                      checked={config.csatSurvey}
                      onChange={(v) => updateConfig('csatSurvey', v)}
                      label="CSAT Survey"
                      description="Show satisfaction survey after conversation"
                    />
                    <Toggle
                      checked={config.fileUpload}
                      onChange={(v) => updateConfig('fileUpload', v)}
                      label="File Upload"
                      description="Allow users to upload files in chat"
                    />
                  </div>
                </CardContent>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <WidgetPreview config={config} />
                  </div>
                </CardContent>
              </>
            )}

            {step === 5 && (
              <>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Copy and paste this code snippet into your website&apos;s HTML, just before the closing{' '}
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-80">
                      {embedCode}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-3 right-3"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy</>
                      )}
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Widget ID: wdg_{config.name.toLowerCase().replace(/\s+/g, '_')}_abc123</p>
                        <p className="text-sm text-blue-700 mt-0.5">
                          This widget will appear on your site after adding the code. Make sure to publish the widget first.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={() => step < 5 ? setStep(step + 1) : undefined}
                disabled={step === 5}
              >
                {step === 5 ? 'Complete' : 'Next'}
                {step < 5 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </div>

        {showPreview && (
          <div className="hidden xl:block flex-shrink-0">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <WidgetPreview config={config} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
