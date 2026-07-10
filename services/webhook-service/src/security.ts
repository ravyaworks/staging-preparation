import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import type { WebhookSecurityConfig } from './types'

const DEFAULT_CONFIG: WebhookSecurityConfig = {
  algorithm: 'sha256',
  headerName: 'X-Webhook-Signature',
  timestampToleranceSeconds: 300,
}

export function createSignatureHeader(payload: string, secret: string, config: Partial<WebhookSecurityConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = signPayload(payload, timestamp, secret, cfg.algorithm)
  return `t=${timestamp},v1=${signature}`
}

export function verifySignature(
  payload: string,
  headerValue: string,
  secret: string,
  config: Partial<WebhookSecurityConfig> = {},
): boolean {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  const parsed = parseSignatureHeader(headerValue)
  if (!parsed) return false

  const { timestamp, signature } = parsed

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > cfg.timestampToleranceSeconds) {
    return false
  }

  const expected = signPayload(payload, timestamp.toString(), secret, cfg.algorithm)

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export function generateSecret(length = 32): string {
  return randomBytes(length).toString('hex')
}

interface ParsedSignature {
  timestamp: number
  signature: string
}

function parseSignatureHeader(header: string): ParsedSignature | null {
  const parts = header.split(',')
  let timestamp = 0
  let signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = Number(value)
    if (key === 'v1') signature = value ?? ''
  }

  if (!timestamp || !signature) return null
  return { timestamp, signature }
}

function signPayload(payload: string, timestamp: string, secret: string, algorithm: 'sha256' | 'sha512'): string {
  const hmac = createHmac(algorithm, secret)
  hmac.update(`${timestamp}.${payload}`)
  return hmac.digest('hex')
}
