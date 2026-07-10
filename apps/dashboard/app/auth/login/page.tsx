'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@conversation-platform/ui'
import { useAuthStore } from '@/lib/auth-store'
import { loginSchema } from '@/lib/validations'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loginUser = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const registered = searchParams.get('registered')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        setServerError(data.message || data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      const data = await response.json()
      loginUser(data.user, data.accessToken, data.refreshToken)

      const role = data.user.role
      if (role === 'super_admin' || role === 'admin') {
        router.push('/admin')
      } else if (role === 'tenant_admin') {
        router.push('/tenant')
      } else {
        router.push('/user')
      }
    } catch {
      setServerError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account to continue
        </p>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            Account created successfully! Please sign in.
          </div>
        )}

        {serverError && (
          <div id="login-error" className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={serverError ? 'login-error' : undefined}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
            aria-required="true"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              error={errors.password}
              autoComplete="current-password"
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
