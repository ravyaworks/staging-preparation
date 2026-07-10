import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SDKNodePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Node.js SDK</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Server-side SDK for Node.js applications, CLI tools, and backend integrations.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <pre>npm install @conversation-platform/sdk-node</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Initialization</h2>
        <pre>
{`import { ConversationPlatformNode } from '@conversation-platform/sdk-node';

const client = new ConversationPlatformNode({
  apiKey: process.env.CONVERSATION_PLATFORM_API_KEY,
  environment: 'production', // or 'sandbox'
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Batch Operations</h2>
        <pre>
{`const results = await client.batch([
  { action: 'channels.list' },
  { action: 'conversations.list', params: { status: 'open' } },
  { action: 'analytics.overview', params: { period: '7d' } },
]);

console.log(results.channels);
console.log(results.conversations);
console.log(results.analytics);`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Webhook Server</h2>
        <pre>
{`import { createWebhookServer } from '@conversation-platform/sdk-node';

const server = createWebhookServer({
  secret: process.env.CP_WEBHOOK_SECRET,
  port: 3000,
});

server.on('message.received', async (event) => {
  console.log('New message:', event.data.content);
  
  await client.messages.send({
    conversationId: event.data.conversationId,
    content: 'Thanks for reaching out!',
    type: 'text',
  });
});

server.on('conversation.created', (event) => {
  console.log('New conversation:', event.data.id);
});

server.start();`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Streaming Responses</h2>
        <pre>
{`const stream = await client.messages.stream({
  conversationId: 'conv_abc',
  model: 'gpt-4o',
  prompt: 'Summarize the conversation',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">CLI Usage</h2>
        <pre>
{`# Install globally
npm install -g @conversation-platform/sdk-node

# List channels
cp-cli channels list

# Send a message
cp-cli messages send --conversation-id conv_abc --content "Hello"

# Export analytics
cp-cli analytics export --period 30d --format csv > report.csv`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Rate Limiting</h2>
        <p>
          The Node.js SDK includes built-in rate limiting. By default, it respects the{' '}
          <code>X-RateLimit-Remaining</code> headers and automatically backs off when limits are
          reached.
        </p>
        <pre>
{`const client = new ConversationPlatformNode({
  apiKey: process.env.CP_API_KEY,
  rateLimiter: {
    maxRetries: 5,
    backoffMs: 1000,
  },
});`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/sdk/nextjs" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Next.js SDK
        </Link>
        <Link href="/guides/authentication" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Authentication <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
