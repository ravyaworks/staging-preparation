import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function WebhooksPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Webhooks API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Receive real-time notifications when events occur in your organization.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/webhooks</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Webhooks</h2>
        <pre>
{`GET /v1/webhooks`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "whk_abc123",
      "url": "https://your-app.com/webhooks/conversation-platform",
      "events": ["message.received", "conversation.created"],
      "status": "active",
      "secret": "whsec_****",
      "createdAt": "2024-03-10T08:00:00Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Webhook</h2>
        <pre>
{`POST /v1/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/conversation-platform",
  "events": ["message.received", "conversation.created", "conversation.updated"],
  "description": "Main event handler"
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "whk_def456",
  "url": "https://your-app.com/webhooks/conversation-platform",
  "events": ["message.received", "conversation.created", "conversation.updated"],
  "status": "active",
  "secret": "whsec_k8j2m9x4...",
  "createdAt": "2024-07-01T12:00:00Z"
}`}
        </pre>
        <p>
          Store the <code>secret</code> securely — it is used to verify webhook signatures.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Update Webhook</h2>
        <pre>
{`PATCH /v1/webhooks/:id
Content-Type: application/json

{
  "events": ["message.received"],
  "status": "inactive"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Webhook</h2>
        <pre>
{`DELETE /v1/webhooks/:id`}
        </pre>
        <p>Returns <code>204 No Content</code> on success.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Events</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>message.received</code> — An incoming message was received</li>
          <li><code>message.sent</code> — A message was successfully sent</li>
          <li><code>conversation.created</code> — A new conversation was started</li>
          <li><code>conversation.updated</code> — A conversation was updated</li>
          <li><code>conversation.closed</code> — A conversation was closed</li>
          <li><code>channel.connected</code> — A channel came online</li>
          <li><code>channel.disconnected</code> — A channel went offline</li>
          <li><code>webhook.failed</code> — A webhook delivery failed</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Webhook Payload</h2>
        <pre>
{`{
  "id": "evt_abc123",
  "type": "message.received",
  "timestamp": "2024-07-01T12:00:00Z",
  "data": {
    "messageId": "msg_xyz",
    "conversationId": "conv_abc",
    "channelId": "ch_123",
    "content": "Hello, I need help!",
    "sender": {
      "id": "user_456",
      "name": "Jane Doe"
    }
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Retries</h2>
        <p>
          Failed webhook deliveries are retried with exponential backoff up to 5 times over 24 hours.
          The retry schedule is: 1 min, 5 min, 30 min, 2 hours, 12 hours.
        </p>
        <p>
          If all retries are exhausted, the event is logged as <code>failed</code> and you can
          retrieve it via the{' '}
          <Link href="/api/webhooks" className="text-blue-600 hover:underline dark:text-blue-400">
            failed events endpoint
          </Link>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Signature Verification</h2>
        <p>
          Each webhook request includes a <code>X-CP-Signature</code> header. Verify it to ensure
          the payload was sent by the platform.
        </p>
        <pre>
{`import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}
        </pre>
        <p>
          See the{' '}
          <Link href="/guides/webhook-security" className="text-blue-600 hover:underline dark:text-blue-400">
            Webhook Security Guide
          </Link>{' '}
          for full details.
        </p>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/channels" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Channels
        </Link>
        <Link href="/api/integrations" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Integrations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
