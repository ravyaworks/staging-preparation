import { z } from 'zod'

const phoneRegex = /^\+?[1-9]\d{6,14}$/

export const singleOutreachSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
  industry: z.string().max(100).optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number. Must be in E.164 format (e.g. +1234567890)'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  previewUrl: z.string().url('Invalid preview URL').optional().or(z.literal('')),
  personalizedMessage: z.string().min(1, 'Personalized message is required').max(5000),
  contactPerson: z.string().max(255).optional(),
  campaignName: z.string().max(255).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const bulkOutreachSchema = z.object({
  businesses: z.array(singleOutreachSchema).min(1, 'At least one business is required').max(1000, 'Maximum 1000 businesses per request'),
})

export const importFileSchema = z.object({
  campaignName: z.string().max(255).optional(),
  campaignId: z.string().uuid().optional(),
})

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  allowedIps: z.array(z.string()).max(50).optional(),
  rateLimitPerMinute: z.number().int().positive().max(10000).default(60),
  expiresAt: z.string().datetime().optional(),
})

export const outreachQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['businessName', 'phone', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type SingleOutreachInput = z.infer<typeof singleOutreachSchema>
export type BulkOutreachInput = z.infer<typeof bulkOutreachSchema>
export type ImportFileInput = z.infer<typeof importFileSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type OutreachQueryInput = z.infer<typeof outreachQuerySchema>
