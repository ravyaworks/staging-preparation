'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Tabs } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Dialog } from '@conversation-platform/ui'
import { cn, formatDate } from '@/lib/utils'
import {
  Code,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Terminal,
  Download,
  Globe,
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  masked: string
  created: string
  lastUsed: string
  status: 'active' | 'revoked'
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  category: string
}

const initialKeys: ApiKey[] = [
  { id: '1', name: 'Production', key: 'cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0', masked: 'cp_live_7xK3****', created: '2024-01-15T10:30:00Z', lastUsed: '2024-07-08T14:22:00Z', status: 'active' },
  { id: '2', name: 'Staging', key: 'cp_test_4yH8nB2kM7jR3tP9wX1cF5vL0qS', masked: 'cp_test_4yH8n****', created: '2024-03-20T08:00:00Z', lastUsed: '2024-07-07T09:15:00Z', status: 'active' },
  { id: '3', name: 'Development', key: 'cp_test_9aD2fG5hJ8kL1pO4iU7yT6rE0w', masked: 'cp_test_9aD2f****', created: '2024-05-10T16:45:00Z', lastUsed: '2024-07-06T11:30:00Z', status: 'revoked' },
]

const endpoints: Endpoint[] = [
  { method: 'GET', path: '/api/v1/conversations', description: 'List all conversations', category: 'Conversations' },
  { method: 'POST', path: '/api/v1/conversations', description: 'Create a new conversation', category: 'Conversations' },
  { method: 'GET', path: '/api/v1/conversations/:id', description: 'Get conversation details', category: 'Conversations' },
  { method: 'DELETE', path: '/api/v1/conversations/:id', description: 'Delete a conversation', category: 'Conversations' },
  { method: 'POST', path: '/api/v1/knowledge/documents', description: 'Upload a document', category: 'Knowledge' },
  { method: 'GET', path: '/api/v1/knowledge/documents', description: 'List knowledge documents', category: 'Knowledge' },
  { method: 'DELETE', path: '/api/v1/knowledge/documents/:id', description: 'Delete a document', category: 'Knowledge' },
  { method: 'POST', path: '/api/v1/workflows', description: 'Create a workflow', category: 'Workflows' },
  { method: 'GET', path: '/api/v1/workflows/:id', description: 'Get workflow status', category: 'Workflows' },
  { method: 'POST', path: '/api/v1/widgets', description: 'Create a widget config', category: 'Widgets' },
  { method: 'PUT', path: '/api/v1/widgets/:id', description: 'Update widget config', category: 'Widgets' },
  { method: 'GET', path: '/api/v1/analytics', description: 'Fetch analytics data', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/channels', description: 'List all channels', category: 'Channels' },
  { method: 'GET', path: '/api/v1/channels/:type', description: 'Get channel details', category: 'Channels' },
  { method: 'POST', path: '/api/v1/channels/:type/connect', description: 'Connect a channel', category: 'Channels' },
  { method: 'POST', path: '/api/v1/channels/:type/disconnect', description: 'Disconnect a channel', category: 'Channels' },
  { method: 'POST', path: '/api/v1/channels/:type/reconnect', description: 'Reconnect a channel', category: 'Channels' },
  { method: 'PATCH', path: '/api/v1/channels/:type/config', description: 'Update channel configuration', category: 'Channels' },
  { method: 'POST', path: '/api/v1/channels/:type/messages', description: 'List channel messages', category: 'Channels' },
  { method: 'POST', path: '/api/v1/channels/:type/webhook', description: 'Handle channel webhook', category: 'Channels' },
  { method: 'POST', path: '/api/v1/messages/send', description: 'Send a message', category: 'Messages' },
  { method: 'POST', path: '/api/v1/messages/broadcast', description: 'Broadcast a message', category: 'Messages' },
  { method: 'POST', path: '/api/v1/messages/incoming', description: 'Process incoming message', category: 'Messages' },
  { method: 'GET', path: '/api/v1/integrations', description: 'List all integrations', category: 'Integrations' },
  { method: 'POST', path: '/api/v1/integrations', description: 'Create an integration', category: 'Integrations' },
  { method: 'GET', path: '/api/v1/integrations/:id', description: 'Get integration details', category: 'Integrations' },
  { method: 'PATCH', path: '/api/v1/integrations/:id', description: 'Update an integration', category: 'Integrations' },
  { method: 'DELETE', path: '/api/v1/integrations/:id', description: 'Delete an integration', category: 'Integrations' },
  { method: 'POST', path: '/api/v1/integrations/api-keys', description: 'Create an API key', category: 'Integrations' },
  { method: 'GET', path: '/api/v1/integrations/api-keys', description: 'List API keys', category: 'Integrations' },
  { method: 'POST', path: '/api/v1/integrations/api-keys/:id/revoke', description: 'Revoke an API key', category: 'Integrations' },
  { method: 'GET', path: '/api/v1/webhooks', description: 'List all webhooks', category: 'Webhooks' },
  { method: 'POST', path: '/api/v1/webhooks', description: 'Register a webhook', category: 'Webhooks' },
  { method: 'GET', path: '/api/v1/webhooks/:id', description: 'Get webhook details', category: 'Webhooks' },
  { method: 'PATCH', path: '/api/v1/webhooks/:id', description: 'Update a webhook', category: 'Webhooks' },
  { method: 'DELETE', path: '/api/v1/webhooks/:id', description: 'Delete a webhook', category: 'Webhooks' },
  { method: 'POST', path: '/api/v1/webhooks/:id/regenerate-secret', description: 'Regenerate webhook secret', category: 'Webhooks' },
  { method: 'GET', path: '/api/v1/webhooks/:id/deliveries', description: 'List webhook deliveries', category: 'Webhooks' },
  { method: 'POST', path: '/api/v1/webhooks/test', description: 'Test a webhook', category: 'Webhooks' },
  { method: 'GET', path: '/api/v1/webhooks/stats', description: 'Get webhook statistics', category: 'Webhooks' },
  { method: 'GET', path: '/api/v1/webhooks/failures', description: 'List webhook failures', category: 'Webhooks' },
]

const categories = ['Conversations', 'Knowledge', 'Workflows', 'Widgets', 'Analytics', 'Channels', 'Messages', 'Integrations', 'Webhooks']

const codeExamples: Record<string, Record<string, string>> = {
  'List Conversations': {
    curl: `curl -X GET "https://api.conversation-platform.com/api/v1/conversations" \\
  -H "Authorization: Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0" \\
  -H "Content-Type: application/json"`,
    javascript: `const response = await fetch('https://api.conversation-platform.com/api/v1/conversations', {
  headers: {
    'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.get(
    'https://api.conversation-platform.com/api/v1/conversations',
    headers={
        'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
        'Content-Type': 'application/json'
    }
)
data = response.json()
print(data)`,
  },
  'Create Conversation': {
    curl: `curl -X POST "https://api.conversation-platform.com/api/v1/conversations" \\
  -H "Authorization: Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`,
    javascript: `const response = await fetch('https://api.conversation-platform.com/api/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
const data = await response.json();`,
    python: `import requests

response = requests.post(
    'https://api.conversation-platform.com/api/v1/conversations',
    headers={
        'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'gpt-4',
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)
data = response.json()`,
  },
  'Connect WhatsApp': {
    curl: `curl -X POST "https://api.conversation-platform.com/api/v1/channels/whatsapp/connect" \\
  -H "Authorization: Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "config": {
      "phoneNumberId": "1234567890",
      "accessToken": "your-access-token",
      "verifyToken": "your-verify-token"
    }
  }'`,
    javascript: `const response = await fetch('https://api.conversation-platform.com/api/v1/channels/whatsapp/connect', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    config: {
      phoneNumberId: '1234567890',
      accessToken: 'your-access-token',
      verifyToken: 'your-verify-token'
    }
  })
});
const data = await response.json();`,
    python: `import requests

response = requests.post(
    'https://api.conversation-platform.com/api/v1/channels/whatsapp/connect',
    headers={
        'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
        'Content-Type': 'application/json'
    },
    json={
        'config': {
            'phoneNumberId': '1234567890',
            'accessToken': 'your-access-token',
            'verifyToken': 'your-verify-token'
        }
    }
)
data = response.json()`,
  },
  'Send Message': {
    curl: `curl -X POST "https://api.conversation-platform.com/api/v1/messages/send" \\
  -H "Authorization: Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "+1234567890",
    "type": "text",
    "content": {
      "text": "Hello from the platform!"
    }
  }'`,
    javascript: `const response = await fetch('https://api.conversation-platform.com/api/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channel: 'whatsapp',
    to: '+1234567890',
    type: 'text',
    content: {
      text: 'Hello from the platform!'
    }
  })
});
const data = await response.json();`,
    python: `import requests

response = requests.post(
    'https://api.conversation-platform.com/api/v1/messages/send',
    headers={
        'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
        'Content-Type': 'application/json'
    },
    json={
        'channel': 'whatsapp',
        'to': '+1234567890',
        'type': 'text',
        'content': {
            'text': 'Hello from the platform!'
        }
    }
)
data = response.json()`,
  },
  'Register Webhook': {
    curl: `curl -X POST "https://api.conversation-platform.com/api/v1/webhooks" \\
  -H "Authorization: Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["message.received", "channel.connected"],
    "description": "Production webhook"
  }'`,
    javascript: `const response = await fetch('https://api.conversation-platform.com/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks',
    events: ['message.received', 'channel.connected'],
    description: 'Production webhook'
  })
});
const data = await response.json();`,
    python: `import requests

response = requests.post(
    'https://api.conversation-platform.com/api/v1/webhooks',
    headers={
        'Authorization': 'Bearer cp_live_7xK3mR9qW2pL5vN8bJ4hF1cD6sA0',
        'Content-Type': 'application/json'
    },
    json={
        'url': 'https://your-app.com/webhooks',
        'events': ['message.received', 'channel.connected'],
        'description': 'Production webhook'
    }
)
data = response.json()`,
  },
}

const sdkLinks = [
  { name: 'SDK Core', icon: <Globe className="h-5 w-5" />, description: '@conversation-platform/sdk', version: 'v0.1.0' },
  { name: 'React SDK', icon: <Code className="h-5 w-5" />, description: '@conversation-platform/sdk-react', version: 'v0.1.0' },
  { name: 'Next.js SDK', icon: <Code className="h-5 w-5" />, description: '@conversation-platform/sdk-nextjs', version: 'v0.1.0' },
  { name: 'Node.js SDK', icon: <Terminal className="h-5 w-5" />, description: '@conversation-platform/sdk-node', version: 'v0.1.0' },
]

const methodColors: Record<string, string> = {
  GET: 'text-green-600 bg-green-50',
  POST: 'text-blue-600 bg-blue-50',
  PUT: 'text-orange-600 bg-orange-50',
  DELETE: 'text-red-600 bg-red-50',
  PATCH: 'text-purple-600 bg-purple-50',
}

export default function DeveloperPortal() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialKeys)
  const [visibleKey, setVisibleKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [activeCodeTab, setActiveCodeTab] = useState('List Conversations')
  const [activeLangTab, setActiveLangTab] = useState('curl')

  const handleCopy = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {return}
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: `cp_live_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`,
      masked: `cp_live_${'*'.repeat(5)}****`,
      created: new Date().toISOString(),
      lastUsed: 'Never',
      status: 'active',
    }
    setApiKeys((prev) => [newKey, ...prev])
    setCreatedKey(newKey.key)
    setNewKeyName('')
    setShowCreateKey(false)
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k)))
  }

  return (
    <>
      <PageHeader title="Developer Portal" description="API keys, endpoints, and SDKs to integrate with the platform">
        <Button onClick={() => setShowCreateKey(true)}>
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">Rate Limit</p>
                <p className="text-2xl font-bold text-blue-700">1,000</p>
                <p className="text-xs text-blue-500">requests per minute</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900">Today&apos;s Usage</p>
                <p className="text-2xl font-bold text-green-700">23,450</p>
                <p className="text-xs text-green-500">API calls</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900">Active Keys</p>
                <p className="text-2xl font-bold text-purple-700">{apiKeys.filter((k) => k.status === 'active').length}</p>
                <p className="text-xs text-purple-500">of {apiKeys.length} total</p>
              </div>
            </div>

            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    apiKey.status === 'revoked' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      apiKey.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                    )}>
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{apiKey.name}</span>
                        <Badge variant={apiKey.status === 'active' ? 'success' : 'danger'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <code className="text-xs font-mono text-gray-500">
                          {visibleKey === apiKey.id ? apiKey.key : apiKey.masked}
                        </code>
                        <button
                          onClick={() => setVisibleKey(visibleKey === apiKey.id ? null : apiKey.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {visibleKey === apiKey.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(apiKey.key, apiKey.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedKey === apiKey.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Created {formatDate(apiKey.created)} &middot; Last used {apiKey.lastUsed === 'Never' ? 'Never' : formatDate(apiKey.lastUsed)}
                      </p>
                    </div>
                  </div>
                  {apiKey.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRevokeKey(apiKey.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              tabs={categories.map((cat) => ({
                id: cat,
                label: cat,
                content: (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endpoints
                        .filter((e) => e.category === cat)
                        .map((e) => (
                          <TableRow key={e.path}>
                            <TableCell>
                              <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold', methodColors[e.method])}>
                                {e.method}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs font-mono text-gray-700">{e.path}</code>
                            </TableCell>
                            <TableCell className="text-gray-500">{e.description}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ),
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {Object.keys(codeExamples).map((example) => (
                <button
                  key={example}
                  onClick={() => setActiveCodeTab(example)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    activeCodeTab === example
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['curl', 'javascript', 'python'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLangTab(lang)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    activeLangTab === lang
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {lang === 'javascript' ? 'JavaScript' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                {codeExamples[activeCodeTab]?.[activeLangTab] || '// Select an example'}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-3 right-3 text-gray-400 border-gray-700 hover:bg-gray-800"
                onClick={() => {
                  const code = codeExamples[activeCodeTab]?.[activeLangTab] || ''
                  navigator.clipboard.writeText(code)
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SDK Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sdkLinks.map((sdk) => (
                <div
                  key={sdk.name}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {sdk.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{sdk.name}</p>
                    <p className="text-xs text-gray-500">{sdk.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="default">{sdk.version}</Badge>
                      <Download className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateKey} onClose={() => { setShowCreateKey(false); setCreatedKey(null) }}>
        <div className="p-6 space-y-4">
          {createdKey ? (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">API Key Created</h3>
                <p className="text-sm text-gray-500 mt-1">Copy this key now. You won&apos;t be able to see it again.</p>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono break-all">{createdKey}</pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => navigator.clipboard.writeText(createdKey)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => { setShowCreateKey(false); setCreatedKey(null) }}>
                Done
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900">Create API Key</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production, Staging"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim()}>Create</Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}
