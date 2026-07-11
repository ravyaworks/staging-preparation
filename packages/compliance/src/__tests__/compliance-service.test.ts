import { describe, it, expect, beforeEach } from 'vitest'
import { ComplianceService } from '../compliance-service'
import type { DataRetentionPolicy } from '../types'

describe('ComplianceService', () => {
  let service: ComplianceService

  beforeEach(() => {
    service = new ComplianceService()
  })

  describe('Consent Management', () => {
    it('records granted consent', () => {
      const record = service.recordConsent('t1', 'u1', 'analytics', 'granted')
      expect(record.status).toBe('granted')
      expect(record.grantedAt).toBeDefined()
    })

    it('records denied consent', () => {
      service.recordConsent('t1', 'u1', 'marketing', 'denied')
      expect(service.getConsent('t1', 'u1', 'marketing')).toBe('denied')
    })

    it('withdraws consent', () => {
      service.recordConsent('t1', 'u1', 'analytics', 'granted')
      service.withdrawConsent('t1', 'u1', 'analytics')
      expect(service.getConsent('t1', 'u1', 'analytics')).toBe('withdrawn')
    })

    it('returns not_set for unset consent', () => {
      expect(service.getConsent('t1', 'u1', 'marketing')).toBe('not_set')
    })

    it('hasConsent checks granted status', () => {
      expect(service.hasConsent('t1', 'u1', 'analytics')).toBe(false)
      service.recordConsent('t1', 'u1', 'analytics', 'granted')
      expect(service.hasConsent('t1', 'u1', 'analytics')).toBe(true)
    })

    it('lists consents for user', () => {
      service.recordConsent('t1', 'u1', 'essential', 'granted')
      service.recordConsent('t1', 'u1', 'analytics', 'granted')
      const consents = service.getConsentsForUser('t1', 'u1')
      expect(consents).toHaveLength(2)
    })

    it('scopes consents by tenant', () => {
      service.recordConsent('t1', 'u1', 'essential', 'granted')
      service.recordConsent('t2', 'u1', 'essential', 'denied')
      expect(service.getConsentsForUser('t1', 'u1')).toHaveLength(1)
    })
  })

  describe('Data Retention Policies', () => {
    it('sets and retrieves a retention policy', () => {
      const policy: DataRetentionPolicy = {
        id: 'rp-1', tenantId: 't1', resourceType: 'conversations',
        retentionDays: 90, action: 'delete', enabled: true,
      }
      service.setRetentionPolicy(policy)
      const retrieved = service.getRetentionPolicy('t1', 'conversations')
      expect(retrieved?.retentionDays).toBe(90)
    })

    it('updates an existing policy', () => {
      service.setRetentionPolicy({
        id: 'rp-1', tenantId: 't1', resourceType: 'conversations',
        retentionDays: 90, action: 'delete', enabled: true,
      })
      service.setRetentionPolicy({
        id: 'rp-1', tenantId: 't1', resourceType: 'conversations',
        retentionDays: 180, action: 'archive', enabled: true,
      })
      expect(service.getRetentionPolicy('t1', 'conversations')?.retentionDays).toBe(180)
    })

    it('lists policies for a tenant', () => {
      service.setRetentionPolicy({
        id: 'rp-1', tenantId: 't1', resourceType: 'conversations',
        retentionDays: 90, action: 'delete', enabled: true,
      })
      service.setRetentionPolicy({
        id: 'rp-2', tenantId: 't1', resourceType: 'messages',
        retentionDays: 30, action: 'delete', enabled: true,
      })
      expect(service.getRetentionPolicies('t1')).toHaveLength(2)
    })
  })

  describe('Data Export (GDPR)', () => {
    it('creates an export request', () => {
      const req = service.requestDataExport('t1', 'u1')
      expect(req.status).toBe('pending')
      expect(req.tenantId).toBe('t1')
      expect(req.userId).toBe('u1')
    })

    it('processes an export request', () => {
      const req = service.requestDataExport('t1', 'u1')
      const processed = service.processDataExport(req.id)
      expect(processed.status).toBe('completed')
      expect(processed.downloadUrl).toBeDefined()
    })

    it('throws for unknown export', () => {
      expect(() => service.processDataExport('unknown')).toThrow('Export request not found')
    })

    it('lists export requests for user', () => {
      service.requestDataExport('t1', 'u1')
      service.requestDataExport('t1', 'u1')
      expect(service.getExportRequestsForUser('t1', 'u1')).toHaveLength(2)
    })
  })

  describe('Data Deletion (GDPR)', () => {
    it('creates a deletion request', () => {
      const req = service.requestDataDeletion('t1', 'u1')
      expect(req.status).toBe('pending')
      expect(req.includes).toContain('users')
    })

    it('processes a deletion request', () => {
      const req = service.requestDataDeletion('t1', 'u1')
      const processed = service.processDataDeletion(req.id)
      expect(processed.status).toBe('completed')
    })

    it('lists deletion requests for user', () => {
      service.requestDataDeletion('t1', 'u1')
      service.requestDataDeletion('t1', 'u1')
      expect(service.getDeletionRequestsForUser('t1', 'u1')).toHaveLength(2)
    })
  })

  describe('Privacy Settings', () => {
    it('returns defaults for new tenant', () => {
      const settings = service.getPrivacySettings('t1')
      expect(settings.requireConsent).toBe(true)
      expect(settings.consentPurposes).toContain('essential')
      expect(settings.enableDataExport).toBe(true)
    })

    it('updates privacy settings', () => {
      const updated = service.updatePrivacySettings('t1', { requireConsent: false, enableDataExport: false })
      expect(updated.requireConsent).toBe(false)
      expect(updated.enableDataExport).toBe(false)
      expect(updated.updatedAt).toBeDefined()
    })
  })
})
