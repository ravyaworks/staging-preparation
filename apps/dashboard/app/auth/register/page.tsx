'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { registerSchema } from '@/lib/validations'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Input } from '@conversation-platform/ui'
import { MessageSquare, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function validate() {
    const result = registerSchema.safeParse({ name, email, password, confirmPassword })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        if (issue.path.length) {
          const key = issue.path[0] as string
          if (!fieldErrors[key]) {
            fieldErrors[key] = issue.message
          }
        }
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
      })

      router.push('/auth/login?registered=true')
    } catch (err: unknown) {
      const error = err as { message?: string; details?: Record<string, string[]> }
      if (error.details) {
        const fieldErrors: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.details)) {
          fieldErrors[key] = messages[0]
        }
        setErrors(fieldErrors)
      } else {
        setApiError(error.message ?? 'An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Create an account</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Get started with Conversation Platform
        </p>
      </CardHeader>

      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Create account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
