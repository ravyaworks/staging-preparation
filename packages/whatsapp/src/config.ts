import type { WhatsAppConfig, WhatsAppApiVersion } from './types'

const DEFAULT_BASE_URL = 'https://graph.facebook.com'
const DEFAULT_API_VERSION: WhatsAppApiVersion = 'v21.0'
const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000

const REQUIRED_ENV_VARS = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_BUSINESS_ACCOUNT_ID',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
] as const

export function loadWhatsAppConfig(): WhatsAppConfig {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required WhatsApp configuration: ${missing.join(', ')}`)
  }

  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    apiVersion: (process.env.WHATSAPP_API_VERSION as WhatsAppApiVersion) ?? DEFAULT_API_VERSION,
    baseUrl: process.env.WHATSAPP_BASE_URL ?? DEFAULT_BASE_URL,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    requestTimeoutMs: parseInt(process.env.WHATSAPP_REQUEST_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS), 10),
    maxRetries: parseInt(process.env.WHATSAPP_MAX_RETRIES ?? String(DEFAULT_MAX_RETRIES), 10),
    retryDelayMs: parseInt(process.env.WHATSAPP_RETRY_DELAY_MS ?? String(DEFAULT_RETRY_DELAY_MS), 10),
  }
}

export function getWhatsAppApiUrl(config: WhatsAppConfig): string {
  return `${config.baseUrl}/${config.apiVersion}/${config.phoneNumberId}`
}

export function getBusinessAccountUrl(config: WhatsAppConfig): string {
  return `${config.baseUrl}/${config.apiVersion}/${config.businessAccountId}`
}
