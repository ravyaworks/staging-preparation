import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function IntegrationsGuidePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Integration Best Practices</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Guidelines for building reliable integrations with the Conversation Platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Architecture Patterns</h2>
        <h3 className="text-lg font-medium">Webhook-Driven Integration</h3>
        <p>
          The recommended approach for most integrations. The platform pushes events to your
          endpoint, and you process them asynchronously.
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Respond with 2xx immediately</li>
          <li>Process events asynchronously</li>
          <li>Use a queue for reliability (BullMQ, SQS, etc.)</li>
          <li>Implement idempotency using event IDs</li>
        </ul>

        <h3 className="text-lg font-medium">Polling-Based Integration</h3>
        <p>
          Use polling when webhooks are not available or for bulk data synchronization.
        </p>
        <pre>
{`// Poll for new conversations
const poll = async () => {
  const conversations = await client.conversations.list({
    createdAfter: lastPollTimestamp,
    status: 'open',
  });

  for (const conv of conversations.data) {
    await processConversation(conv);
  }

  lastPollTimestamp = new Date().toISOString();
};

// Poll every 30 seconds
setInterval(poll, 30000);`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Handling</h2>
        <pre>
{`import { APIError } from '@conversation-platform/sdk';

async function safeApiCall(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case 429:
          // Rate limited — wait and retry
          const retryAfter = error.headers['retry-after'] || 60;
          await sleep(retryAfter * 1000);
          return fn();
        case 500:
        case 502:
        case 503:
          // Server error — retry with backoff
          return retryWithBackoff(fn);
        case 401:
          throw new Error('Invalid API key');
        case 404:
          return null;
        default:
          throw error;
      }
    }
    throw error;
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Mapping</h2>
        <p>
          Map between your CRM/support system fields and Conversation Platform metadata:
        </p>
        <pre>
{`// Mapping a Zendesk ticket to a conversation
const mapTicketToConversation = (ticket) => ({
  channelId: 'ch_zendesk',
  participantId: \`user_\${ticket.requester.id}\`,
  topic: ticket.subject,
  metadata: {
    ticketId: ticket.id,
    priority: ticket.priority,
    tags: ticket.tags,
    zendeskUrl: ticket.url,
  },
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Syncing Conversations</h2>
        <pre>
{`// Bidirectional sync example
async function syncConversations() {
  // Pull external messages into platform
  const externalMessages = await fetchExternalMessages();
  for (const msg of externalMessages) {
    const existing = await client.messages.list({
      conversationId: msg.conversationId,
      metadata: { externalId: msg.id },
    });

    if (existing.data.length === 0) {
      await client.messages.send({
        conversationId: msg.conversationId,
        content: msg.body,
        type: 'text',
        metadata: { externalId: msg.id },
      });
    }
  }

  // Push platform messages to external system
  const platformMessages = await client.messages.list({
    direction: 'outgoing',
    createdAfter: lastSync,
  });
  for (const msg of platformMessages.data) {
    await sendToExternalSystem(msg);
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Performance Tips</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Use bulk/batch endpoints when available</li>
          <li>Cache frequently accessed data (channels, knowledge bases)</li>
          <li>Implement request coalescing for high-throughput scenarios</li>
          <li>Use pagination cursors instead of offset-based pagination</li>
          <li>Monitor rate limit headers to avoid hitting limits</li>
          <li>Use webhooks instead of polling wherever possible</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Testing</h2>
        <pre>
{`// Use test keys and sandbox environment
const testClient = new ConversationPlatform({
  apiKey: process.env.CP_TEST_API_KEY,
  baseUrl: 'https://sandbox.api.conversation-platform.dev',
});

// Test webhook delivery
await client.webhooks.test('whk_abc123');

// Verify with test payload
const result = await testClient.messages.send({
  conversationId: 'test_conv',
  content: 'Test message',
  type: 'text',
});
console.log(result.status); // 'sent' in sandbox`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Security Checklist</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Store API keys in environment variables</li>
          <li>Verify webhook signatures on every request</li>
          <li>Use HTTPS for all webhook endpoints</li>
          <li>Implement request validation and sanitization</li>
          <li>Use scoped API keys with minimum permissions</li>
          <li>Rotate secrets regularly</li>
          <li>Log and monitor API usage for anomalies</li>
        </ul>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/guides/channel-setup" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Channel Setup
        </Link>
      </div>
    </div>
  );
}
