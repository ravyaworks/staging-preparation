import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiKeyService } from '../services/api-key.service'
import type { PrismaClient } from '@prisma/client'

const mockPrisma = {
  outreachApiKey: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient

const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any

describe('ApiKeyService', () => {
  let service: ApiKeyService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ApiKeyService(mockPrisma, mockLogger)
  })

  describe('create', () => {
    it('creates an API key and returns it with rawKey', async () => {
      vi.mocked(mockPrisma.outreachApiKey.create).mockResolvedValue({
        id: 'key-1',
        name: 'Test Key',
        key: 'hashed-key-123',
        keyPrefix: 'oci_abc',
        organizationId: 'org-1',
        tenantId: null,
        createdBy: 'user-1',
        isActive: true,
        allowedIps: [],
        rateLimitPerMinute: 60,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      })

      const result = await service.create({ name: 'Test Key' }, 'org-1', 'user-1')

      expect(result.name).toBe('Test Key')
      expect(result.keyPrefix).toBeTruthy()
      expect(result.rawKey).toBeTruthy()
      expect(result.rawKey.startsWith('oci_')).toBe(true)
      expect(mockPrisma.outreachApiKey.create).toHaveBeenCalledOnce()
    })

    it('stores hashed key in database', async () => {
      await service.create({ name: 'Test Key' }, 'org-1', 'user-1')

      const createCall = vi.mocked(mockPrisma.outreachApiKey.create).mock.calls[0]![0]
      expect(createCall.data.key).not.toContain('oci_')
    })
  })

  describe('validate', () => {
    it('returns valid for an active key', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue({
        id: 'key-1',
        key: 'hashed',
        isActive: true,
        organizationId: 'org-1',
        tenantId: null,
        expiresAt: null,
        name: 'Test',
        keyPrefix: 'oci_abc',
        createdBy: 'user-1',
        allowedIps: [],
        rateLimitPerMinute: 60,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(mockPrisma.outreachApiKey.update).mockResolvedValue({} as any)

      const result = await service.validate('test-key-raw')

      expect(result.valid).toBe(true)
      expect(result.organizationId).toBe('org-1')
    })

    it('returns invalid for non-existent key', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue(null)

      const result = await service.validate('nonexistent-key')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Invalid API key')
    })

    it('returns invalid for inactive key', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue({
        id: 'key-1',
        key: 'hashed',
        isActive: false,
        organizationId: 'org-1',
        tenantId: null,
        expiresAt: null,
        name: 'Test',
        keyPrefix: 'oci_abc',
        createdBy: 'user-1',
        allowedIps: [],
        rateLimitPerMinute: 60,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.validate('test-key-raw')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('API key is deactivated')
    })

    it('returns invalid for expired key', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue({
        id: 'key-1',
        key: 'hashed',
        isActive: true,
        organizationId: 'org-1',
        tenantId: null,
        expiresAt: new Date('2020-01-01'),
        name: 'Test',
        keyPrefix: 'oci_abc',
        createdBy: 'user-1',
        allowedIps: [],
        rateLimitPerMinute: 60,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.validate('test-key-raw')

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('API key has expired')
    })
  })

  describe('list', () => {
    it('returns all keys for an organization', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findMany).mockResolvedValue([
        {
          id: 'key-1', name: 'Key 1', keyPrefix: 'oci_abc', isActive: true,
          allowedIps: [], rateLimitPerMinute: 60, lastUsedAt: null, expiresAt: null,
          createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'key-2', name: 'Key 2', keyPrefix: 'oci_def', isActive: false,
          allowedIps: [], rateLimitPerMinute: 30, lastUsedAt: null, expiresAt: null,
          createdAt: new Date('2025-01-02'), updatedAt: new Date('2025-01-02'),
        },
      ])

      const result = await service.list('org-1')

      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('Key 1')
      expect(result[1]!.name).toBe('Key 2')
    })
  })

  describe('revoke', () => {
    it('deactivates an API key', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue({
        id: 'key-1', organizationId: 'org-1',
      } as any)
      vi.mocked(mockPrisma.outreachApiKey.update).mockResolvedValue({} as any)

      await service.revoke('key-1', 'org-1')

      expect(mockPrisma.outreachApiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'key-1' },
          data: { isActive: false },
        }),
      )
    })

    it('throws when key not found in organization', async () => {
      vi.mocked(mockPrisma.outreachApiKey.findUnique).mockResolvedValue({
        id: 'key-1', organizationId: 'other-org',
      } as any)

      await expect(service.revoke('key-1', 'org-1')).rejects.toThrow('API key not found')
    })
  })
})
