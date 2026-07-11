import { describe, it, expect, beforeEach } from 'vitest'
import { BillingEngine } from '../billing-engine'

describe('BillingEngine', () => {
  let engine: BillingEngine

  beforeEach(() => {
    engine = new BillingEngine()
  })

  describe('getPlans', () => {
    it('returns all active plans', () => {
      const plans = engine.getPlans()
      expect(plans.length).toBeGreaterThanOrEqual(4)
    })

    it('filters by tier', () => {
      const free = engine.getPlans('free')
      expect(free).toHaveLength(1)
      expect(free[0]?.tier).toBe('free')
    })
  })

  describe('getPlan', () => {
    it('returns plan by id', () => {
      const plan = engine.getPlan('plan_free')
      expect(plan).toBeDefined()
      expect(plan?.name).toBe('Free')
    })

    it('returns undefined for unknown plan', () => {
      expect(engine.getPlan('nonexistent')).toBeUndefined()
    })
  })

  describe('createSubscription', () => {
    it('creates an active subscription', () => {
      const sub = engine.createSubscription('tenant-1', 'plan_starter')
      expect(sub.tenantId).toBe('tenant-1')
      expect(sub.planId).toBe('plan_starter')
      expect(sub.status).toBe('active')
      expect(sub.billingCycle).toBe('monthly')
    })

    it('throws for unknown plan', () => {
      expect(() => engine.createSubscription('t1', 'unknown')).toThrow('Plan unknown not found')
    })

    it('throws if tenant already has active subscription', () => {
      engine.createSubscription('t1', 'plan_free')
      expect(() => engine.createSubscription('t1', 'plan_starter')).toThrow('already has an active subscription')
    })
  })

  describe('getSubscription', () => {
    it('returns subscription for tenant', () => {
      engine.createSubscription('tenant-1', 'plan_free')
      const sub = engine.getSubscription('tenant-1')
      expect(sub).toBeDefined()
    })

    it('returns undefined for tenant without subscription', () => {
      expect(engine.getSubscription('unknown')).toBeUndefined()
    })
  })

  describe('cancelSubscription', () => {
    it('cancels an active subscription', () => {
      engine.createSubscription('t1', 'plan_free')
      const cancelled = engine.cancelSubscription('t1')
      expect(cancelled.status).toBe('canceled')
      expect(cancelled.canceledAt).toBeDefined()
    })

    it('throws for tenant without subscription', () => {
      expect(() => engine.cancelSubscription('unknown')).toThrow('No subscription found')
    })
  })

  describe('changePlan', () => {
    it('changes plan for existing subscription', () => {
      engine.createSubscription('t1', 'plan_free')
      const updated = engine.changePlan('t1', 'plan_starter')
      expect(updated.planId).toBe('plan_starter')
    })

    it('throws for unknown plan', () => {
      engine.createSubscription('t1', 'plan_free')
      expect(() => engine.changePlan('t1', 'unknown')).toThrow()
    })
  })

  describe('recordUsage and getUsageSummary', () => {
    it('records and aggregates usage', () => {
      engine.createSubscription('t1', 'plan_free')
      engine.recordUsage('t1', 'messages_sent', 10)
      engine.recordUsage('t1', 'messages_sent', 20)
      engine.recordUsage('t1', 'messages_received', 5)

      const summary = engine.getUsageSummary('t1')
      expect(summary.metrics.messages_sent).toBe(30)
      expect(summary.metrics.messages_received).toBe(5)
    })

    it('shows percentage usage', () => {
      engine.createSubscription('t1', 'plan_free')
      engine.recordUsage('t1', 'messages_sent', 500)

      const summary = engine.getUsageSummary('t1')
      expect(summary.percentUsed.messages_sent).toBeGreaterThan(0)
      expect(summary.overLimit).toBe(false)
    })

    it('detects over-limit usage', () => {
      engine.createSubscription('t1', 'plan_free')
      engine.recordUsage('t1', 'messages_sent', 2000)

      const summary = engine.getUsageSummary('t1')
      expect(summary.overLimit).toBe(true)
      expect(summary.overLimitMetrics).toContain('messages_sent')
    })
  })

  describe('checkLimit', () => {
    it('allows within-limit usage', () => {
      engine.createSubscription('t1', 'plan_free')
      expect(engine.checkLimit('t1', 'messages_sent', 500)).toBe(true)
    })

    it('blocks over-limit usage', () => {
      engine.createSubscription('t1', 'plan_free')
      engine.recordUsage('t1', 'messages_sent', 950)
      expect(engine.checkLimit('t1', 'messages_sent', 100)).toBe(false)
    })

    it('allows unlimited metrics', () => {
      engine.createSubscription('t1', 'plan_enterprise')
      expect(engine.checkLimit('t1', 'messages_sent', 999999)).toBe(true)
    })
  })

  describe('generateInvoice', () => {
    it('generates invoice for active subscription', () => {
      engine.createSubscription('t1', 'plan_starter')
      const invoice = engine.generateInvoice('t1')
      expect(invoice.amount).toBe(29)
      expect(invoice.lineItems).toHaveLength(1)
      expect(invoice.status).toBe('open')
    })

    it('throws for tenant without subscription', () => {
      expect(() => engine.generateInvoice('unknown')).toThrow('No active subscription')
    })
  })
})
