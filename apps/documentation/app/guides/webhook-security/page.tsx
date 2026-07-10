import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function WebhookSecurityGuidePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Webhook Security</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Verify webhook signatures to ensure requests are authentic and untampered.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <p>
          Every webhook request includes an <code>X-CP-Signature</code> header containing an HMAC
          SHA-256 signature of the raw request body, signed with your webhook secret.
        </p>
        <p>
          By verifying this signature, you can confirm that the request was sent by the
          Conversation Platform and the payload was not modified in transit.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Retrieving Your Secret</h2>
        <p>
          When you create a webhook via the API or dashboard, a <code>whsec_</code> prefixed secret
          is returned. Store this securely — it will not be shown again.
        </p>
        <pre>
{`POST /v1/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["message.received"]
}

// Response includes the secret:
{
  "id": "whk_abc123",
  "secret": "whsec_k8j2m9x4p..."
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Node.js Verification</h2>
        <pre>
{`import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const timestamp = signature.split(',')[0].split('=')[1];
  const sig = signature.split(',')[1].split('=')[1];

  const signedPayload = \`\${timestamp}.\${payload}\`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-cp-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.CP_WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process the webhook...
  res.json({ received: true });
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Python Verification</h2>
        <pre>
{`import hmac
import hashlib

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    parts = dict(item.split('=') for item in signature.split(','))
    timestamp = parts.get('t', '')
    sig = parts.get('v1', '')

    signed_payload = f"{timestamp}.{payload}"
    expected = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(sig, expected)`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Signature Format</h2>
        <pre>
{`X-CP-Signature: t=1719856800,v1=a1b2c3d4e5f6...

t   = Timestamp of when the webhook was sent
v1  = HMAC SHA-256 signature`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Timestamp Validation</h2>
        <p>
          Always check the timestamp to prevent replay attacks. Reject webhooks with timestamps
          older than 5 minutes.
        </p>
        <pre>
{`function isTimestampValid(signature, maxAge = 300) {
  const timestamp = parseInt(signature.split(',')[0].split('=')[1]);
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - timestamp) <= maxAge;
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using the SDK</h2>
        <p>
          The Node.js SDK includes a built-in verification method:
        </p>
        <pre>
{`import { verifyWebhook } from '@conversation-platform/sdk-node';

app.post('/webhook', (req, res) => {
  const event = verifyWebhook(req.body, req.headers, {
    secret: process.env.CP_WEBHOOK_SECRET,
  });

  if (!event) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event...
  res.json({ received: true });
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Always verify signatures before processing webhooks</li>
          <li>Use timing-safe comparison to prevent timing attacks</li>
          <li>Validate timestamps to prevent replay attacks</li>
          <li>Use HTTPS for your webhook endpoints</li>
          <li>Return 2xx quickly and process asynchronously</li>
          <li>Implement idempotency using the event ID</li>
        </ul>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/guides/authentication" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Authentication
        </Link>
        <Link href="/guides/channel-setup" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Channel Setup <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
