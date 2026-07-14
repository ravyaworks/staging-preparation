/**
 * WhatsApp Connection Validation Script
 *
 * Validates the WhatsApp Business Platform integration against the live Meta API.
 * Run with: tsx scripts/whatsapp/validate-connection.ts
 *
 * Requires the following environment variables:
 *   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
 *   WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *
 * Optional:
 *   WHATSAPP_API_VERSION (default: v21.0)
 *   WHATSAPP_APP_SECRET
 */

import { loadWhatsAppConfig, WhatsAppApiClient, WhatsAppValidator } from '@conversation-platform/whatsapp'
import { createPinoLogger } from '../../apps/api/src/lib/logger'

interface DiagnosticResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details: string
  error?: string
}

async function main(): Promise<void> {
  const logger = createPinoLogger('whatsapp-validator', { level: 'info', pretty: true })
  const results: DiagnosticResult[] = []
  let allPassed = true

  function record(name: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string, error?: string): void {
    results.push({ name, status, details, error })
    if (status === 'FAIL') allPassed = false
    const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⊘'
    console.log(`  ${icon} ${name}: ${status}  —  ${details}${error ? `\n     Error: ${error}` : ''}`)
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  WhatsApp Business Platform — Connection Validation')
  console.log('═══════════════════════════════════════════════════════════════\n')

  // ── Step 1: Configuration Loading ──────────────────────────────────────
  console.log('── Step 1: Configuration ─────────────────────────────────────')

  let config
  try {
    config = loadWhatsAppConfig()
    record('Config Loading', 'PASS', `API: ${config.apiVersion}, Phone: ${mask(config.phoneNumberId)}, BA: ${mask(config.businessAccountId)}`)
  } catch (error) {
    record('Config Loading', 'FAIL', 'Cannot load WhatsApp configuration', error instanceof Error ? error.message : String(error))
    printSummary(results)
    process.exit(1)
  }

  // ── Step 2: Phone Validation ───────────────────────────────────────────
  console.log('\n── Step 2: Phone Number Validation ────────────────────────────')

  try {
    const validator = new WhatsAppValidator()
    const phoneValid = validator.validatePhoneNumber(config.phoneNumberId)
    record('Phone Number ID Format', 'PASS', `Phone Number ID "${mask(config.phoneNumberId)}" is valid`)
  } catch (error) {
    record('Phone Number ID Format', 'FAIL', 'Phone Number ID validation failed', error instanceof Error ? error.message : String(error))
  }

  // ── Step 3: API Connectivity ──────────────────────────────────────────
  console.log('\n── Step 3: API Connectivity ───────────────────────────────────')

  let client: WhatsAppApiClient
  try {
    client = new WhatsAppApiClient(config, logger)
    record('API Client Init', 'PASS', 'WhatsAppApiClient created successfully')
  } catch (error) {
    record('API Client Init', 'FAIL', 'Failed to create API client', error instanceof Error ? error.message : String(error))
    printSummary(results)
    process.exit(1)
  }

  // ── Step 4: Test API Connection ───────────────────────────────────────
  console.log('\n── Step 4: API Connection Test ────────────────────────────────')

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    const data = await response.json() as any
    if (response.ok) {
      record('Graph API Connectivity', 'PASS', `Phone Number ID "${config.phoneNumberId}" is valid and accessible`)
    } else {
      const fbError = data?.error?.message ?? response.statusText
      const fbCode = data?.error?.code ?? response.status
      record('Graph API Connectivity', 'FAIL', `API returned error ${fbCode}`, fbError)
    }
  } catch (error) {
    record('Graph API Connectivity', 'FAIL', 'Cannot reach Facebook Graph API', error instanceof Error ? error.message : String(error))
  }

  // ── Step 5: Token Validation ──────────────────────────────────────────
  console.log('\n── Step 5: Access Token Validation ────────────────────────────')

  try {
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${config.accessToken}`
    const tokenResponse = await fetch(debugUrl, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    const tokenData = await tokenResponse.json() as any
    if (tokenResponse.ok && tokenData?.data) {
      const td = tokenData.data
      const isExpired = td.expires_at && td.expires_at * 1000 < Date.now()
      const scopes = (td.scopes ?? []).join(', ')
      if (isExpired) {
        record('Access Token', 'FAIL', 'Token is expired', `Expired at ${new Date(td.expires_at * 1000).toISOString()}`)
      } else if (!td.is_valid) {
        record('Access Token', 'FAIL', 'Token is invalid', `Type: ${td.type}, App: ${td.app_id}`)
      } else {
        const expiresStr = td.expires_at ? `Expires: ${new Date(td.expires_at * 1000).toISOString()}` : 'No expiry'
        record('Access Token', 'PASS', `Token is valid. Type: ${td.type}, Scopes: ${scopes.slice(0, 100)}, ${expiresStr}`)
      }
    } else {
      record('Access Token', 'FAIL', 'Token validation failed', tokenData?.error?.message ?? 'Unknown error')
    }
  } catch (error) {
    record('Access Token', 'FAIL', 'Cannot validate token', error instanceof Error ? error.message : String(error))
  }

  // ── Step 6: Webhook Configuration ─────────────────────────────────────
  console.log('\n── Step 6: Webhook Configuration ──────────────────────────────')

  if (config.webhookVerifyToken && config.webhookVerifyToken.length >= 8) {
    record('Webhook Verify Token', 'PASS', `Verify token configured (${config.webhookVerifyToken.length} chars)`)
  } else {
    record('Webhook Verify Token', 'FAIL', 'Verify token is missing or too short (< 8 chars)')
  }

  if (config.appSecret) {
    record('App Secret', 'PASS', 'App secret configured (enables X-Hub-Signature-256 verification)')
  } else {
    record('App Secret', 'SKIP', 'App secret not set — webhook signature verification disabled')
  }

  // ── Step 7: Phone Number Details ──────────────────────────────────────
  console.log('\n── Step 7: Phone Number Details ───────────────────────────────')

  try {
    const phoneUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,platform_type,throughput,last_onboarded_time`
    const phoneResponse = await fetch(phoneUrl, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    const phoneData = await phoneResponse.json() as any
    if (phoneResponse.ok) {
      record('Phone Number Details', 'PASS',
        `Phone: ${phoneData.display_phone_number ?? 'N/A'}, ` +
        `Name: ${phoneData.verified_name ?? 'N/A'}, ` +
        `Quality: ${phoneData.quality_rating ?? 'N/A'}, ` +
        `Platform: ${phoneData.platform_type ?? 'N/A'}`
      )
    } else {
      record('Phone Number Details', 'FAIL', 'Cannot fetch phone number details', phoneData?.error?.message ?? 'Unknown error')
    }
  } catch (error) {
    record('Phone Number Details', 'FAIL', 'Cannot fetch phone number details', error instanceof Error ? error.message : String(error))
  }

  // ── Summary ───────────────────────────────────────────────────────────
  printSummary(results)
  process.exit(allPassed ? 0 : 1)
}

function printSummary(results: DiagnosticResult[]): void {
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  Validation Summary')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Passed:  ${passed}`)
  console.log(`  Failed:  ${failed}`)
  console.log(`  Skipped: ${skipped}`)
  console.log('───────────────────────────────────────────────────────────────')

  if (failed === 0) {
    console.log('  ✅  All checks passed — WhatsApp integration is ready for live use.')
  } else {
    console.log(`  ⚠️   ${failed} check(s) failed — fix before using in production.`)
    const failures = results.filter(r => r.status === 'FAIL')
    for (const f of failures) {
      console.log(`       - ${f.name}: ${f.details}`)
    }
  }
  console.log('═══════════════════════════════════════════════════════════════\n')
}

function mask(id: string): string {
  if (id.length <= 6) return id
  return id.slice(0, 3) + '***' + id.slice(-3)
}

main().catch((error) => {
  console.error('Validation script failed:', error)
  process.exit(1)
})
