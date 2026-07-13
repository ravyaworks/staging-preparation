import { WhatsAppError } from '../types'

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/
const MESSAGE_MAX_LENGTH = 4096
const TEMPLATE_NAME_REGEX = /^[a-z0-9_]{1,512}$/
const FILENAME_MAX_LENGTH = 240

export class WhatsAppValidator {
  validatePhoneNumber(phone: string): string {
    const cleaned = phone.startsWith('+') ? phone : `+${phone}`
    if (!PHONE_REGEX.test(cleaned)) {
      throw new WhatsAppError(
        `Invalid phone number: ${phone}. Must be in E.164 format (e.g. +1234567890)`,
        'INVALID_PHONE',
        400,
      )
    }
    return cleaned
  }

  validateMessageBody(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new WhatsAppError('Message body cannot be empty', 'EMPTY_MESSAGE', 400)
    }
    if (message.length > MESSAGE_MAX_LENGTH) {
      throw new WhatsAppError(
        `Message exceeds maximum length of ${MESSAGE_MAX_LENGTH} characters`,
        'MESSAGE_TOO_LONG',
        400,
      )
    }
  }

  validateTemplateName(name: string): void {
    if (!name || !TEMPLATE_NAME_REGEX.test(name)) {
      throw new WhatsAppError(
        `Invalid template name: ${name}. Must match ${TEMPLATE_NAME_REGEX}`,
        'INVALID_TEMPLATE_NAME',
        400,
      )
    }
  }

  validateTemplateVariables(template: { components: Array<{ type: string; text?: string }> }, variables: Record<string, string>): void {
    const bodyComponent = template.components.find(c => c.type === 'BODY')
    if (!bodyComponent?.text) return

    const placeholders = bodyComponent.text.match(/\{\{(\d+)\}\}/g) ?? []
    const requiredCount = placeholders.length
    const providedCount = Object.keys(variables).length

    if (requiredCount !== providedCount) {
      throw new WhatsAppError(
        `Template requires ${requiredCount} variables but ${providedCount} provided`,
        'TEMPLATE_VARIABLE_MISMATCH',
        400,
      )
    }

    for (const key of Object.keys(variables)) {
      if (!variables[key] || variables[key].trim().length === 0) {
        throw new WhatsAppError(
          `Template variable '${key}' cannot be empty`,
          'EMPTY_TEMPLATE_VARIABLE',
          400,
        )
      }
    }
  }

  validateMediaFile(filename: string, mimeType: string, fileSize: number): void {
    if (!filename || filename.length > FILENAME_MAX_LENGTH) {
      throw new WhatsAppError('Invalid filename', 'INVALID_FILENAME', 400)
    }

    const supportedTypes: Record<string, { maxSize: number }> = {
      'image/jpeg': { maxSize: 5 * 1024 * 1024 },
      'image/png': { maxSize: 5 * 1024 * 1024 },
      'application/pdf': { maxSize: 100 * 1024 * 1024 },
      'application/msword': { maxSize: 100 * 1024 * 1024 },
      'video/mp4': { maxSize: 16 * 1024 * 1024 },
      'video/3gp': { maxSize: 16 * 1024 * 1024 },
      'audio/aac': { maxSize: 16 * 1024 * 1024 },
      'audio/mp4': { maxSize: 16 * 1024 * 1024 },
      'audio/mpeg': { maxSize: 16 * 1024 * 1024 },
      'audio/amr': { maxSize: 16 * 1024 * 1024 },
      'audio/ogg': { maxSize: 16 * 1024 * 1024 },
    }

    const typeInfo = supportedTypes[mimeType]
    if (!typeInfo) {
      throw new WhatsAppError(`Unsupported media type: ${mimeType}`, 'UNSUPPORTED_MEDIA_TYPE', 400)
    }

    if (fileSize > typeInfo.maxSize) {
      throw new WhatsAppError(
        `File exceeds maximum size of ${typeInfo.maxSize / (1024 * 1024)}MB for ${mimeType}`,
        'FILE_TOO_LARGE',
        400,
      )
    }
  }

  validateWebhookPayload(payload: unknown): payload is { object: 'whatsapp_business_account'; entry: Array<unknown> } {
    if (!payload || typeof payload !== 'object') return false
    const p = payload as Record<string, unknown>
    return p.object === 'whatsapp_business_account' && Array.isArray(p.entry)
  }
}
