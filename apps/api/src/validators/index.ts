import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  tenantName: z.string().min(1).max(255),
  tenantSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  domain: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const outreachSendSchema = z.object({
  recipientName: z.string().min(1).max(255),
  recipientPhone: z.string().regex(phoneRegex, 'Invalid phone number. Must be in E.164 format (e.g. +1234567890)'),
  messageTemplate: z.string().min(1).max(500),
  personalizedMessage: z.string().min(1).max(5000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type OutreachSendPayload = z.infer<typeof outreachSendSchema>;
