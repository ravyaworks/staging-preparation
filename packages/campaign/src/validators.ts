import { z } from 'zod'

const phoneRegex = /^\+?[1-9]\d{6,14}$/

const supportedChannels = [
  'whatsapp', 'email', 'sms', 'telegram',
  'instagram', 'messenger', 'slack', 'website', 'api',
] as const

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  channel: z.enum(supportedChannels),
})

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  channel: z.enum(supportedChannels).optional(),
})

export const importBusinessSchema = z.object({
  businesses: z.array(z.object({
    businessName: z.string().min(1, 'Business name is required'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number. Must be in E.164 format (e.g. +1234567890)'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    industry: z.string().max(100).optional(),
    previewUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    personalizedMessage: z.string().min(1, 'Personalized message is required'),
  })).min(1, 'At least one business is required'),
})

export const csvImportRowSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  industry: z.string().optional(),
  previewUrl: z.string().optional(),
  personalizedMessage: z.string().min(1, 'Personalized message is required'),
})

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  channel: z.enum(supportedChannels).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'status', 'channel', 'createdAt', 'startedAt', 'completedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const businessQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.string().optional(),
  sortBy: z.enum(['businessName', 'phone', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type ImportBusinessInput = z.infer<typeof importBusinessSchema>
export type CsvImportRow = z.infer<typeof csvImportRowSchema>
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>
export type BusinessQueryInput = z.infer<typeof businessQuerySchema>
