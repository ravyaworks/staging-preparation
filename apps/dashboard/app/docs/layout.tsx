'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Rocket,
  Puzzle,
  Code,
  FileText,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Terminal,
} from 'lucide-react'

interface NavSection {
  title: string
  icon: React.ReactNode
  items: { href: string; label: string }[]
}

const navSections: NavSection[] = [
  {
    title: 'Getting Started',
    icon: <Rocket className="h-4 w-4" />,
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/quickstart', label: 'Quickstart Guide' },
      { href: '/docs/installation', label: 'Installation' },
      { href: '/docs/authentication', label: 'Authentication' },
    ],
  },
  {
    title: 'Features',
    icon: <Puzzle className="h-4 w-4" />,
    items: [
      { href: '/docs/conversations', label: 'Conversations' },
      { href: '/docs/knowledge-base', label: 'Knowledge Base' },
      { href: '/docs/widget', label: 'Chat Widget' },
      { href: '/docs/workflows', label: 'Workflows' },
      { href: '/docs/analytics', label: 'Analytics' },
    ],
  },
  {
    title: 'API Reference',
    icon: <Code className="h-4 w-4" />,
    items: [
      { href: '/docs/api/overview', label: 'Overview' },
      { href: '/docs/api/conversations', label: 'Conversations API' },
      { href: '/docs/api/knowledge', label: 'Knowledge API' },
      { href: '/docs/api/workflows', label: 'Workflows API' },
      { href: '/docs/api/webhooks', label: 'Webhooks' },
      { href: '/docs/api/rate-limits', label: 'Rate Limits' },
    ],
  },
  {
    title: 'Changelog',
    icon: <FileText className="h-4 w-4" />,
    items: [
      { href: '/docs/changelog/v2', label: 'v2.0.0 - Major Update' },
      { href: '/docs/changelog/v1', label: 'v1.5.0 - Feature Release' },
      { href: '/docs/changelog/v1-1', label: 'v1.0.0 - Initial Release' },
    ],
  },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Getting Started': true,
    'Features': false,
    'API Reference': false,
    'Changelog': false,
  })

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const content = (
    <div className="flex h-full">
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 px-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Documentation</span>
          </div>
          <nav className="space-y-1">
            {navSections.map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400">{section.icon}</span>
                    {section.title}
                  </span>
                  {expandedSections[section.title] ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
                {expandedSections[section.title] && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block px-2 py-1.5 text-sm rounded-lg transition-colors',
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/developer"
            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Terminal className="h-4 w-4" />
            Developer Portal
          </Link>
          <Link
            href="/help"
            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )

  return <DashboardLayout>{content}</DashboardLayout>
}


