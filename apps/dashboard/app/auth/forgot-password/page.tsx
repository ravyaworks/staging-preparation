'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Input } from '@conversation-platform/ui'
import { MessageSquare, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function validate() {
    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return false
    }
    setError('')
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
      await api.post('/auth/forgot-password', { email })
      setIsSuccess(true)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setApiError(error.message ?? 'An unexpected error occurred')
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
        <CardTitle>Reset your password</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          {isSuccess
            ? 'Check your email for a reset link'
            : 'Enter your email and we&apos;ll send you a reset link'}
        </p>
      </CardHeader>

      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">
              If an account exists with that email, we&apos;ve sent a password
              reset link. Please check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoComplete="email"
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
