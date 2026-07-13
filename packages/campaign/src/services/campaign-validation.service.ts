import { CampaignError } from '../types'
import type { CampaignStatus } from '../types'

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['ready', 'cancelled'],
  ready: ['running', 'cancelled', 'draft'],
  running: ['paused', 'completed', 'cancelled', 'failed'],
  paused: ['running', 'cancelled', 'completed'],
  completed: [],
  cancelled: [],
  failed: ['draft'],
}

export class CampaignValidationService {
  validateTransition(from: CampaignStatus, to: CampaignStatus): void {
    if (from === to) return

    const allowed = VALID_TRANSITIONS[from]
    if (!allowed) {
      throw new CampaignError(
        `Unknown campaign status: ${from}`,
        'INVALID_STATUS',
        500,
      )
    }

    if (!allowed.includes(to)) {
      throw new CampaignError(
        `Cannot transition campaign from "${from}" to "${to}". ` +
        `Allowed transitions: ${allowed.map(s => `"${s}"`).join(', ') || 'none'}`,
        'INVALID_TRANSITION',
        400,
      )
    }
  }

  validateBusinessImport(businesses: { businessName: string; phone: string; personalizedMessage: string }[]): void {
    const errors: { row: number; field: string; message: string }[] = []
    const seenPhones = new Set<string>()

    for (const [i, b] of businesses.entries()) {
      const row = i + 1
      const prefix = `Row ${row}`

      if (!b.businessName?.trim()) {
        errors.push({ row, field: 'businessName', message: `${prefix}: Business name is required` })
      }

      if (!b.phone?.trim()) {
        errors.push({ row, field: 'phone', message: `${prefix}: Phone number is required` })
      } else if (seenPhones.has(b.phone)) {
        errors.push({ row, field: 'phone', message: `${prefix}: Duplicate phone number "${b.phone}"` })
      } else {
        seenPhones.add(b.phone)
      }

      if (!b.personalizedMessage?.trim()) {
        errors.push({ row, field: 'personalizedMessage', message: `${prefix}: Personalized message is required` })
      }
    }

    if (errors.length > 0) {
      throw new CampaignError(
        `Validation failed: ${errors.length} error(s) found`,
        'VALIDATION_ERROR',
        400,
      )
    }
  }
}
