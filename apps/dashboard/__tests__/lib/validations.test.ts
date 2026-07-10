import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  tenantSchema,
  userSchema,
  conversationSettingsSchema,
} from '@/lib/validations'

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true)
    }
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'John',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  }

  it('accepts valid input', () => {
    const result = registerSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects password mismatch', () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      ...valid,
      name: 'J',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: 'bad',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('tenantSchema', () => {
  it('accepts valid input', () => {
    const result = tenantSchema.safeParse({
      name: 'My Tenant',
      slug: 'my-tenant',
    })
    expect(result.success).toBe(true)
  })

  it('accepts input with all fields', () => {
    const result = tenantSchema.safeParse({
      name: 'My Tenant',
      slug: 'my-tenant',
      domain: 'example.com',
      settings: { maxUsers: 100, maxConversations: 50, features: ['analytics'] },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug with uppercase', () => {
    const result = tenantSchema.safeParse({
      name: 'My Tenant',
      slug: 'My-Tenant',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug with spaces', () => {
    const result = tenantSchema.safeParse({
      name: 'My Tenant',
      slug: 'my tenant',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid slug with special chars', () => {
    const result = tenantSchema.safeParse({
      name: 'My Tenant',
      slug: 'my_tenant!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = tenantSchema.safeParse({ slug: 'my-tenant' })
    expect(result.success).toBe(false)
  })

  it('rejects short slug', () => {
    const result = tenantSchema.safeParse({ name: 'T', slug: 'a' })
    expect(result.success).toBe(false)
  })
})

describe('userSchema', () => {
  it('accepts valid input', () => {
    const result = userSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all roles', () => {
    for (const role of ['super_admin', 'admin', 'tenant_admin', 'user'] as const) {
      const result = userSchema.safeParse({
        name: 'User',
        email: 'user@example.com',
        role,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid email', () => {
    const result = userSchema.safeParse({
      name: 'Jane Doe',
      email: 'bad-email',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short name', () => {
    const result = userSchema.safeParse({
      name: 'J',
      email: 'jane@example.com',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = userSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'superadmin',
    })
    expect(result.success).toBe(false)
  })
})

describe('conversationSettingsSchema', () => {
  it('accepts valid input', () => {
    const result = conversationSettingsSchema.safeParse({
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 2048,
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional systemPrompt', () => {
    const result = conversationSettingsSchema.safeParse({
      model: 'gpt-4',
      temperature: 0,
      maxTokens: 1,
      systemPrompt: 'Be helpful',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing model', () => {
    const result = conversationSettingsSchema.safeParse({
      temperature: 0.5,
      maxTokens: 2048,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty model', () => {
    const result = conversationSettingsSchema.safeParse({
      model: '',
      temperature: 0.5,
      maxTokens: 2048,
    })
    expect(result.success).toBe(false)
  })

  it('rejects temperature out of range (too high)', () => {
    const result = conversationSettingsSchema.safeParse({
      model: 'gpt-4',
      temperature: 3,
      maxTokens: 2048,
    })
    expect(result.success).toBe(false)
  })

  it('rejects temperature out of range (negative)', () => {
    const result = conversationSettingsSchema.safeParse({
      model: 'gpt-4',
      temperature: -1,
      maxTokens: 2048,
    })
    expect(result.success).toBe(false)
  })

  it('rejects maxTokens out of range', () => {
    const result = conversationSettingsSchema.safeParse({
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 0,
    })
    expect(result.success).toBe(false)
  })
})
