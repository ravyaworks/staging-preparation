'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Code2,
  FileText,
  BookMarked,
  Home,
  Menu,
  X,
  ChevronRight,
  Zap,
  Shield,
  MessageSquare,
  Webhook,
  Puzzle,
  BarChart3,
  FileCode,
  Server,
  Globe,
  Settings,
  Layers,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/', icon: <Home className="w-4 h-4" /> },
      { title: 'Quick Start', href: '/getting-started', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { title: 'Channels', href: '/api/channels', icon: <Globe className="w-4 h-4" /> },
      { title: 'Webhooks', href: '/api/webhooks', icon: <Webhook className="w-4 h-4" /> },
      { title: 'Integrations', href: '/api/integrations', icon: <Puzzle className="w-4 h-4" /> },
      { title: 'Conversations', href: '/api/conversations', icon: <MessageSquare className="w-4 h-4" /> },
      { title: 'Messages', href: '/api/messages', icon: <FileText className="w-4 h-4" /> },
      { title: 'Knowledge', href: '/api/knowledge', icon: <BookOpen className="w-4 h-4" /> },
      { title: 'Workflows', href: '/api/workflows', icon: <Layers className="w-4 h-4" /> },
      { title: 'Analytics', href: '/api/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    title: 'SDK Reference',
    items: [
      { title: 'Core', href: '/sdk/core', icon: <Code2 className="w-4 h-4" /> },
      { title: 'React', href: '/sdk/react', icon: <Code2 className="w-4 h-4" /> },
      { title: 'Next.js', href: '/sdk/nextjs', icon: <Code2 className="w-4 h-4" /> },
      { title: 'Node.js', href: '/sdk/node', icon: <Server className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Authentication', href: '/guides/authentication', icon: <Shield className="w-4 h-4" /> },
      { title: 'Webhook Security', href: '/guides/webhook-security', icon: <Shield className="w-4 h-4" /> },
      { title: 'Channel Setup', href: '/guides/channel-setup', icon: <Settings className="w-4 h-4" /> },
      { title: 'Integration Best Practices', href: '/guides/integrations', icon: <BookMarked className="w-4 h-4" /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="space-y-6">
      {navigation.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.title}
                  {isActive(item.href) && (
                    <ChevronRight className="ml-auto w-3 h-3" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-50 rounded-md border bg-white p-2 shadow-md lg:hidden dark:border-gray-700 dark:bg-gray-900"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 overflow-y-auto border-r bg-gray-50 p-4 transition-transform lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-2 px-3">
          <FileCode className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold">Docs</span>
        </div>
        {navContent}
      </aside>
    </>
  );
}
