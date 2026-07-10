import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const tenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  domain: z.string().optional(),
  settings: z.object({
    maxUsers: z.number().min(1).optional(),
    maxConversations: z.number().min(1).optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
})

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['super_admin', 'admin', 'tenant_admin', 'user']),
  tenantId: z.string().optional(),
})

export const conversationSettingsSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(32768),
  systemPrompt: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TenantInput = z.infer<typeof tenantSchema>
export type UserInput = z.infer<typeof userSchema>
export type ConversationSettingsInput = z.infer<typeof conversationSettingsSchema>
