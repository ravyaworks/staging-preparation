import { describe, it, expect } from 'vitest'
import { singleOutreachSchema, bulkOutreachSchema, createApiKeySchema, outreachQuerySchema } from '../validators'

describe('singleOutreachSchema', () => {
  const validPayload = {
    businessName: 'Test Business',
    phone: '+1234567890',
    personalizedMessage: 'Hello, this is a test message',
  }

  it('validates a correct single outreach request', () => {
    const result = singleOutreachSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('rejects missing business name', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, businessName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone number', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, phone: '123' })
    expect(result.success).toBe(false)
  })

  it('accepts optional email', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts optional preview URL', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, previewUrl: 'https://example.com/preview' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid preview URL', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, previewUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('accepts optional tags', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, tags: ['restaurant', 'new'] })
    expect(result.success).toBe(true)
  })

  it('rejects too many tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`)
    const result = singleOutreachSchema.safeParse({ ...validPayload, tags })
    expect(result.success).toBe(false)
  })

  it('accepts optional metadata', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, metadata: { source: 'api', campaign: 'test' } })
    expect(result.success).toBe(true)
  })

  it('accepts optional campaign name', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, campaignName: 'Restaurant Outreach' })
    expect(result.success).toBe(true)
  })

  it('accepts optional contact person', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, contactPerson: 'John Doe' })
    expect(result.success).toBe(true)
  })

  it('rejects empty personalized message', () => {
    const result = singleOutreachSchema.safeParse({ ...validPayload, personalizedMessage: '' })
    expect(result.success).toBe(false)
  })
})

describe('bulkOutreachSchema', () => {
  it('validates a bulk request with multiple businesses', () => {
    const result = bulkOutreachSchema.safeParse({
      businesses: [
        { businessName: 'Biz A', phone: '+1111111111', personalizedMessage: 'Msg A' },
        { businessName: 'Biz B', phone: '+2222222222', personalizedMessage: 'Msg B' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty businesses array', () => {
    const result = bulkOutreachSchema.safeParse({ businesses: [] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 1000 businesses', () => {
    const businesses = Array.from({ length: 1001 }, (_, i) => ({
      businessName: `Biz ${i}`,
      phone: `+1${String(i).padStart(10, '0')}`,
      personalizedMessage: `Message ${i}`,
    }))
    const result = bulkOutreachSchema.safeParse({ businesses })
    expect(result.success).toBe(false)
  })

  it('rejects with invalid business in array', () => {
    const result = bulkOutreachSchema.safeParse({
      businesses: [
        { businessName: '', phone: 'invalid', personalizedMessage: '' },
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe('createApiKeySchema', () => {
  it('validates a correct API key request', () => {
    const result = createApiKeySchema.safeParse({ name: 'Test Key' })
    expect(result.success).toBe(true)
  })

  it('applies default rate limit', () => {
    const result = createApiKeySchema.safeParse({ name: 'Test Key' })
    expect(result.success && result.data.rateLimitPerMinute).toBe(60)
  })

  it('accepts optional allowed IPs', () => {
    const result = createApiKeySchema.safeParse({ name: 'Test Key', allowedIps: ['192.168.1.1'] })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = createApiKeySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('outreachQuerySchema', () => {
  it('provides default pagination', () => {
    const result = outreachQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sortBy).toBe('createdAt')
      expect(result.data.sortOrder).toBe('desc')
    }
  })

  it('accepts custom pagination', () => {
    const result = outreachQuerySchema.safeParse({ page: '2', limit: '50', status: 'pending' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
      expect(result.data.status).toBe('pending')
    }
  })

  it('rejects limit over 100', () => {
    const result = outreachQuerySchema.safeParse({ limit: '200' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid sort field', () => {
    const result = outreachQuerySchema.safeParse({ sortBy: 'invalid' })
    expect(result.success).toBe(false)
  })
})
