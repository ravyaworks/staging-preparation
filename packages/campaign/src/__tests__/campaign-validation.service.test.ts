import { describe, it, expect } from 'vitest'
import { CampaignValidationService } from '../services/campaign-validation.service'
import type { CampaignStatus } from '../types'
import { CampaignError } from '../types'

const service = new CampaignValidationService()

describe('CampaignValidationService', () => {
  describe('validateTransition', () => {
    const validTransitions: [CampaignStatus, CampaignStatus][] = [
      ['draft', 'ready'],
      ['draft', 'cancelled'],
      ['ready', 'running'],
      ['ready', 'cancelled'],
      ['ready', 'draft'],
      ['running', 'paused'],
      ['running', 'completed'],
      ['running', 'cancelled'],
      ['running', 'failed'],
      ['paused', 'running'],
      ['paused', 'cancelled'],
      ['paused', 'completed'],
      ['failed', 'draft'],
    ]

    it.each(validTransitions)('allows %s -> %s', (from, to) => {
      expect(() => service.validateTransition(from, to)).not.toThrow()
    })

    const invalidTransitions: [CampaignStatus, CampaignStatus][] = [
      ['draft', 'running'],
      ['draft', 'completed'],
      ['draft', 'failed'],
      ['ready', 'completed'],
      ['ready', 'failed'],
      ['running', 'draft'],
      ['running', 'ready'],
      ['paused', 'draft'],
      ['paused', 'ready'],
      ['paused', 'failed'],
      ['completed', 'draft'],
      ['completed', 'ready'],
      ['completed', 'running'],
      ['cancelled', 'draft'],
      ['cancelled', 'ready'],
      ['failed', 'ready'],
      ['failed', 'running'],
    ]

    it.each(invalidTransitions)('rejects %s -> %s', (from, to) => {
      expect(() => service.validateTransition(from, to)).toThrow(CampaignError)
    })

    it('does not throw when status is the same', () => {
      expect(() => service.validateTransition('draft', 'draft')).not.toThrow()
      expect(() => service.validateTransition('running', 'running')).not.toThrow()
    })
  })

  describe('validateBusinessImport', () => {
    it('passes valid businesses', () => {
      const businesses = [
        { businessName: 'Acme Corp', phone: '+1234567890', personalizedMessage: 'Hello Acme!' },
        { businessName: 'Beta Inc', phone: '+9876543210', personalizedMessage: 'Hello Beta!' },
      ]
      expect(() => service.validateBusinessImport(businesses)).not.toThrow()
    })

    it('throws on empty business name', () => {
      const businesses = [
        { businessName: '', phone: '+1234567890', personalizedMessage: 'Hello' },
      ]
      expect(() => service.validateBusinessImport(businesses)).toThrow(CampaignError)
    })

    it('throws on missing phone', () => {
      const businesses = [
        { businessName: 'Acme Corp', phone: '', personalizedMessage: 'Hello' },
      ]
      expect(() => service.validateBusinessImport(businesses)).toThrow(CampaignError)
    })

    it('throws on missing message', () => {
      const businesses = [
        { businessName: 'Acme Corp', phone: '+1234567890', personalizedMessage: '' },
      ]
      expect(() => service.validateBusinessImport(businesses)).toThrow(CampaignError)
    })

    it('throws on duplicate phone numbers', () => {
      const businesses = [
        { businessName: 'Acme Corp', phone: '+1234567890', personalizedMessage: 'Hello' },
        { businessName: 'Acme Dup', phone: '+1234567890', personalizedMessage: 'Hello again' },
      ]
      expect(() => service.validateBusinessImport(businesses)).toThrow(CampaignError)
    })
  })
})
