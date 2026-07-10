'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Input } from '@conversation-platform/ui'
import { MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react'
import { z } from 'zod'

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function validate() {
    const result = resetSchema.safeParse({ password, confirmPassword })
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

    if (!token) {
      setApiError('Invalid or missing reset token')
      return
    }

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/reset-password', {
        token,
        password,
      })

      router.push('/auth/login')
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

  if (!token) {
    return (
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">
            Invalid or missing reset token. Please request a new password reset.
          </p>
        </div>
      </CardContent>
    )
  }

  return (
    <>
      <CardContent>
        {apiError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            label="Confirm new password"
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            Reset password
          </Button>
        </form>
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
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Set new password</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Enter your new password below
        </p>
      </CardHeader>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </Card>
  )
}
