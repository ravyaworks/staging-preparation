'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@conversation-platform/ui'
import { MessageSquare } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }

    if (user.role === 'super_admin' || user.role === 'admin') {
      router.replace('/admin')
    } else if (user.role === 'tenant_admin') {
      router.replace('/tenant')
    } else {
      router.replace('/user')
    }
  }, [isAuthenticated, user, router])

  if (isAuthenticated && user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              Conversation Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-xl bg-blue-50 p-3 mb-6">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            AI-Powered Conversations
            <span className="text-blue-600"> for Your Business</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            A multi-tenant platform for building, managing, and analyzing
            intelligent conversation workflows. Deploy AI agents that understand
            your customers.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <p className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Conversation Platform. All rights
          reserved.
        </p>
      </footer>
    </div>
  )
}
