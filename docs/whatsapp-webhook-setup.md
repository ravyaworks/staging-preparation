# WhatsApp Webhook Setup Guide

## Prerequisites

Before configuring the webhook, ensure you have:

1. A **Meta Business Account** with WhatsApp access
2. A **WhatsApp Business Account** (WABA) linked to your Meta Business
3. A **phone number** registered and approved on the WhatsApp Business Platform
4. A **System User** with `whatsapp_business_messaging` and `whatsapp_business_management` permissions
5. A **permanent access token** from the System User

## Environment Variables

Required in your `.env`:

```bash
# ── WhatsApp Cloud API ──────────────────────────────────────────────────
WHATSAPP_ACCESS_TOKEN=EAAT...            # System user permanent token
WHATSAPP_PHONE_NUMBER_ID=123456789       # Phone number ID (numeric)
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321   # Business Account ID (numeric)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my-verify-token  # Custom string (≥8 chars)
WHATSAPP_APP_SECRET=abc123...            # Meta App Secret (for signature verification)
WHATSAPP_API_VERSION=v21.0               # Graph API version

# ── Optional WhatsApp ───────────────────────────────────────────────────
WHATSAPP_BASE_URL=https://graph.facebook.com
WHATSAPP_REQUEST_TIMEOUT_MS=30000
WHATSAPP_MAX_RETRIES=3
WHATSAPP_RETRY_DELAY_MS=1000
```

## Getting Your Meta Credentials

### 1. Create a System User

1. Go to [Meta Business Suite](https://business.facebook.com/) → Business Settings
2. Navigate to **Users** → **System Users**
3. Click **Add** and create a new system user
4. Assign the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Click **Generate Token** and select the WhatsApp app
6. Copy the generated token — this is your `WHATSAPP_ACCESS_TOKEN`

### 2. Find Your Phone Number ID

1. Go to **Meta Developers** → [Your App](https://developers.facebook.com/apps/)
2. Navigate to **WhatsApp** → **API Setup**
3. You'll see your **Phone Number ID** listed — this is `WHATSAPP_PHONE_NUMBER_ID`

### 3. Find Your Business Account ID

1. In the same **API Setup** page
2. Look for **Business Account ID** (`whatsapp_business_account` ID)
3. This is `WHATSAPP_BUSINESS_ACCOUNT_ID`

### 4. Get Your App Secret

1. In **Meta Developers** → **Your App** → **Settings** → **Basic**
2. Copy the **App Secret** — this is `WHATSAPP_APP_SECRET`

## Configuring the Webhook in Meta

### Step 1: Start Your Application

```bash
# Set environment variables in .env
cp .env.example .env
# Edit .env with your WhatsApp credentials

# Start the API
docker compose -f docker-compose.staging.yml up -d api

# Or run directly
pnpm dev --filter @conversation-platform/api
```

### Step 2: Configure the Webhook URL in Meta

1. Go to **Meta Developers** → **Your App** → **WhatsApp** → **API Setup**
2. Under **Webhook**, click **Configure**
3. Enter your webhook callback URL:
   ```
   https://your-domain.com/api/v1/whatsapp/webhook
   ```
   - For local testing, use [ngrok](https://ngrok.com/): `https://xxxx.ngrok.io/api/v1/whatsapp/webhook`
4. Enter your **Verify Token** (must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
5. Click **Verify and Save**

### Step 3: Subscribe to Webhook Fields

After verification, subscribe to these fields:

| Field | Purpose |
|-------|---------|
| `messages` | Incoming messages and status updates |
| `message_template_status_update` | Template approval/rejection notifications |
| `account_alerts` | Account-level notifications |
| `message_template_quality_update` | Template quality rating changes |

### Step 4: Test the Webhook

```bash
# 1. Test the endpoint health
curl https://your-domain.com/api/v1/whatsapp/webhook/test

# Expected response:
# {"status":"ok","message":"WhatsApp webhook endpoint is active","timestamp":"...","config":{...}}

# 2. Simulate the verification challenge
curl "https://your-domain.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=123456789"

# Expected response: 123456789
```

## Security

### Request Signature Verification

The webhook endpoint verifies incoming requests using `X-Hub-Signature-256`:

1. Meta signs each webhook request body with your `WHATSAPP_APP_SECRET` using HMAC-SHA256
2. The signature is sent in the `X-Hub-Signature-256` header
3. The webhook router recomputes the HMAC and compares it using timing-safe comparison
4. Requests with invalid signatures are rejected with `403 Forbidden`

If `WHATSAPP_APP_SECRET` is not configured, signature verification is skipped (not recommended for production).

### Endpoint Protection

| Endpoint | Method | Protection |
|----------|--------|------------|
| `/api/v1/whatsapp/webhook` | GET | Meta challenge verification (no auth) |
| `/api/v1/whatsapp/webhook` | POST | Rate limited + signature verified |
| `/api/v1/whatsapp/webhook/test` | GET | Health check (no auth) |
| `/api/v1/whatsapp/*` | All others | JWT authentication required |

## Validation

Run the connection validation script to verify everything is correctly configured:

```bash
# Set all WHATSAPP_* env vars in your .env or export them
source .env
tsx scripts/whatsapp/validate-connection.ts
```

Expected output:
```
  WhatsApp Business Platform — Connection Validation

  ✓ Config Loading: PASS  —  API: v21.0, Phone: 123***789
  ✓ Phone Number ID Format: PASS  —  Phone Number ID is valid
  ✓ API Client Init: PASS  —  WhatsAppApiClient created successfully
  ✓ Graph API Connectivity: PASS  —  Phone Number ID is valid and accessible
  ✓ Access Token: PASS  —  Token is valid. Type: SYSTEM, Expires: ...
  ✓ Webhook Verify Token: PASS  —  Verify token configured (16 chars)
  ✓ App Secret: PASS  —  App secret configured
  ✓ Phone Number Details: PASS  —  Phone: +15551234567, Name: My Business, Quality: GREEN

  ✅  All checks passed — WhatsApp integration is ready for live use.
```

## Troubleshooting

### Webhook Verification Fails (403)

| Cause | Solution |
|-------|----------|
| Verify token mismatch | Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches what you entered in Meta |
| Endpoint not reachable | Ensure your server is publicly accessible (use ngrok for local testing) |
| Wrong webhook URL | Check the URL format: `https://domain.com/api/v1/whatsapp/webhook` |

### Message Sending Fails

| Cause | Solution |
|-------|----------|
| Token expired | Generate a new permanent token from the System User |
| Wrong phone number ID | Verify `WHATSAPP_PHONE_NUMBER_ID` is correct |
| Recipient hasn't opted in | WhatsApp requires opt-in for business messaging (24h window or approved template) |
| Rate limited | Wait for rate limit window to reset; check `WHATSAPP_MAX_RETRIES` |

### Signature Verification Fails (403 on POST)

| Cause | Solution |
|-------|----------|
| Wrong app secret | Verify `WHATSAPP_APP_SECRET` matches your Meta App Secret |
| Body encoding mismatch | Ensure `express.json()` captures raw body correctly |
| Missing app secret | Set `WHATSAPP_APP_SECRET` or signature check is skipped |

### Quick Diagnostics

```bash
# 1. Check if env vars are loaded
echo $WHATSAPP_ACCESS_TOKEN | head -c 10

# 2. Run the validation script
tsx scripts/whatsapp/validate-connection.ts

# 3. Check API logs
docker compose -f docker-compose.staging.yml logs api | grep whatsapp
```
