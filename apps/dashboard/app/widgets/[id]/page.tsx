'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { Select } from '@conversation-platform/ui'
import { Toggle } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Skeleton } from '@conversation-platform/ui'
import { ErrorState } from '@conversation-platform/ui'
import { cn } from '@/lib/utils'
import {
  Puzzle,
  Palette,
  Copy,
  Check,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

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
  status: 'active' | 'draft' | 'inactive'
}

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

function WidgetPreview({ config }: { config: WidgetConfig }) {
  return (
    <div className="mx-auto bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl overflow-hidden" style={{ width: 280, height: 560 }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-gray-700 rounded-b-2xl z-10" />
      <div className="h-full bg-white flex flex-col">
        <div className="bg-gray-50 px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">Support</p>
            <p className="text-[10px] text-green-600">Online</p>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-2.5 py-1.5 max-w-[80%]">
              <p className="text-xs text-gray-700">{config.greetingMessage}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 p-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type..."
              className="flex-1 text-xs bg-gray-100 rounded-full px-3 py-1.5 outline-none"
              readOnly
            />
            <button className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-3 right-3 w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: config.primaryColor }}
      >
        <MessageSquare className="h-5 w-5 text-white" />
      </div>
    </div>
  )
}

export default function WidgetDetail() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    configure: true,
    appearance: false,
    behavior: false,
  })

  const [config, setConfig] = useState<WidgetConfig>({
    name: '',
    themeColor: '#3b82f6',
    position: 'bottom-right',
    greetingMessage: '',
    launcherStyle: 'bubble',
    primaryColor: '#3b82f6',
    font: 'Inter',
    cornerRadius: 12,
    darkMode: false,
    showBrand: true,
    autoOpenDelay: 5,
    offlineMessage: '',
    csatSurvey: true,
    fileUpload: true,
    status: 'draft',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setConfig({
        name: 'Support Widget',
        themeColor: '#3b82f6',
        position: 'bottom-right',
        greetingMessage: 'Hi there! How can I help you?',
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
        status: 'active',
      })
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const updateConfig = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load widget" description={error} onRetry={() => setError(null)} />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={loading ? 'Loading...' : config.name}
        description={loading ? '' : `Widget ID: wdg_${params.id}`}
      >
        <div className="flex items-center gap-2">
          <Link href="/widgets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Badge variant={config.status === 'active' ? 'success' : config.status === 'draft' ? 'default' : 'danger'}>
            {config.status}
          </Badge>
          <Button size="sm" onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <><Check className="h-4 w-4" /> Saved</>
            ) : (
              <><Save className="h-4 w-4" /> Save</>
            )}
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 flex gap-6">
        <div className={cn('flex-1 space-y-4', showPreview ? 'max-w-3xl' : 'max-w-5xl')}>
          {loading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ) : (
            <>
              {[
                { id: 'configure', title: 'Configure', icon: <Puzzle className="h-4 w-4" /> },
                { id: 'appearance', title: 'Appearance', icon: <Palette className="h-4 w-4" /> },
                { id: 'behavior', title: 'Behavior', icon: <Zap className="h-4 w-4" /> },
              ].map((section) => (
                <Card key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {section.icon}
                      </div>
                      <span className="text-base font-semibold text-gray-900">{section.title}</span>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections[section.id] && (
                    <CardContent className="space-y-5 pt-4">
                      {section.id === 'configure' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Widget Name</label>
                              <Input value={config.name} onChange={(e) => updateConfig('name', e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                              <div className="flex gap-2">
                                <Input value={config.themeColor} onChange={(e) => updateConfig('themeColor', e.target.value)} />
                                <input type="color" value={config.themeColor} onChange={(e) => updateConfig('themeColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                              <Select value={config.position} onChange={(e) => updateConfig('position', e.target.value)} options={positions} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Launcher Style</label>
                              <Select value={config.launcherStyle} onChange={(e) => updateConfig('launcherStyle', e.target.value)} options={launcherStyles} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
                            <textarea value={config.greetingMessage} onChange={(e) => updateConfig('greetingMessage', e.target.value)} rows={2} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </>
                      )}
                      {section.id === 'appearance' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                              <div className="flex gap-2">
                                <Input value={config.primaryColor} onChange={(e) => updateConfig('primaryColor', e.target.value)} />
                                <input type="color" value={config.primaryColor} onChange={(e) => updateConfig('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                              <Select value={config.font} onChange={(e) => updateConfig('font', e.target.value)} options={fonts} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Corner Radius: {config.cornerRadius}px</label>
                            <input type="range" min={0} max={24} value={config.cornerRadius} onChange={(e) => updateConfig('cornerRadius', parseInt(e.target.value))} className="w-full" />
                          </div>
                          <div className="space-y-3">
                            <Toggle checked={config.darkMode} onChange={(v) => updateConfig('darkMode', v)} label="Dark Mode" description="Enable dark theme for the widget" />
                            <Toggle checked={config.showBrand} onChange={(v) => updateConfig('showBrand', v)} label="Show Branding" description="Display 'Powered by Conversation Platform'" />
                          </div>
                        </>
                      )}
                      {section.id === 'behavior' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Open Delay: {config.autoOpenDelay}s</label>
                            <input type="range" min={0} max={30} value={config.autoOpenDelay} onChange={(e) => updateConfig('autoOpenDelay', parseInt(e.target.value))} className="w-full" />
                            <p className="text-xs text-gray-400 mt-1">Widget will auto-open after this delay (0 to disable)</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offline Message</label>
                            <textarea value={config.offlineMessage} onChange={(e) => updateConfig('offlineMessage', e.target.value)} rows={2} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                          <div className="space-y-3">
                            <Toggle checked={config.csatSurvey} onChange={(v) => updateConfig('csatSurvey', v)} label="CSAT Survey" description="Show satisfaction survey after conversation" />
                            <Toggle checked={config.fileUpload} onChange={(v) => updateConfig('fileUpload', v)} label="File Upload" description="Allow users to upload files in chat" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-32">
                      {`<script src="https://cdn.conversation-platform.com/widget.js" data-widget-id="${params.id}"></script>`}
                    </pre>
                    <Button variant="outline" size="sm" className="absolute top-2 right-2">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete Widget
                </Button>
              </div>
            </>
          )}
        </div>

        {showPreview && !loading && (
          <div className="hidden xl:block flex-shrink-0">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6 relative">
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
