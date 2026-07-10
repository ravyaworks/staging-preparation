'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import {
  Search,
  Rocket,
  Code,
  FileText,
  ArrowRight,
  MessageSquare,
  Database,
  Workflow,
  Zap,
  Smartphone,
  Terminal,
} from 'lucide-react'
import Link from 'next/link'

const featuredArticles = [
  {
    title: 'Quickstart Guide',
    description: 'Get up and running in 5 minutes with our step-by-step guide.',
    category: 'Getting Started',
    icon: <Rocket className="h-5 w-5" />,
    href: '/docs/quickstart',
    readTime: '5 min',
  },
  {
    title: 'Chat Widget Setup',
    description: 'Embed our intelligent chat widget on your website.',
    category: 'Features',
    icon: <MessageSquare className="h-5 w-5" />,
    href: '/docs/widget',
    readTime: '8 min',
  },
  {
    title: 'API Overview',
    description: 'Learn how to integrate with our RESTful API.',
    category: 'API Reference',
    icon: <Code className="h-5 w-5" />,
    href: '/docs/api/overview',
    readTime: '10 min',
  },
  {
    title: 'Knowledge Base',
    description: 'Create and manage your AI knowledge base.',
    category: 'Features',
    icon: <Database className="h-5 w-5" />,
    href: '/docs/knowledge-base',
    readTime: '6 min',
  },
  {
    title: 'Workflows',
    description: 'Automate conversations with custom workflows.',
    category: 'Features',
    icon: <Workflow className="h-5 w-5" />,
    href: '/docs/workflows',
    readTime: '7 min',
  },
  {
    title: 'Webhooks',
    description: 'Receive real-time events from the platform.',
    category: 'API Reference',
    icon: <Zap className="h-5 w-5" />,
    href: '/docs/api/webhooks',
    readTime: '4 min',
  },
]

const categories = [
  { label: 'Getting Started', count: 4, icon: <Rocket className="h-4 w-4" /> },
  { label: 'Conversations', count: 6, icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Knowledge Base', count: 5, icon: <Database className="h-4 w-4" /> },
  { label: 'Widget', count: 3, icon: <Smartphone className="h-4 w-4" /> },
  { label: 'Workflows', count: 4, icon: <Workflow className="h-4 w-4" /> },
  { label: 'API Reference', count: 12, icon: <Code className="h-4 w-4" /> },
  { label: 'Changelog', count: 3, icon: <FileText className="h-4 w-4" /> },
]

const searchResults = [
  { title: 'Quickstart Guide', category: 'Getting Started', excerpt: 'Learn how to quickly set up and start using the Conversation Platform...' },
  { title: 'Authentication', category: 'Getting Started', excerpt: 'Understand how to authenticate your API requests using API keys...' },
  { title: 'Chat Widget Configuration', category: 'Features', excerpt: 'Customize the appearance and behavior of your chat widget...' },
]

export default function DocsHome() {
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    setShowSearch(value.length > 0)
  }

  return (
    <>
      <PageHeader title="Documentation" description="Learn how to integrate and use the Conversation Platform" />

      <div className="space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search documentation..."
            className="pl-12 py-3 text-base rounded-xl border-gray-200"
          />
          {showSearch && (
            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-gray-200">
              <CardContent className="p-3 space-y-2">
                {searchResults
                  .filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.excerpt.toLowerCase().includes(search.toLowerCase()))
                  .map((r) => (
                    <Link key={r.title} href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{r.title}</span>
                        <Badge variant="default">{r.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{r.excerpt}</p>
                    </Link>
                  ))}
                {searchResults.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No results found for &quot;{search}&quot;</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href="#"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  {cat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                  <p className="text-xs text-gray-400">{cat.count} articles</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => (
              <Link key={article.title} href={article.href}>
                <Card className="h-full hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {article.icon}
                      </div>
                      <Badge variant="default">{article.category}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{article.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{article.readTime} read</span>
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold mb-2">Need help?</h2>
            <p className="text-blue-100 mb-6">
              Can&apos;t find what you&apos;re looking for? Check out our API reference or reach out to our support team.
            </p>
            <div className="flex gap-3">
              <Link href="/developer">
                <Button variant="secondary">
                  <Terminal className="h-4 w-4" />
                  API Reference
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="secondary">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
