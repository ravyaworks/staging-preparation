import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get up and running with the Conversation Platform in minutes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <p>Install the SDK using your preferred package manager:</p>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">npm</h3>
          <pre>npm install @conversation-platform/sdk</pre>
          <h3 className="text-lg font-medium">pnpm</h3>
          <pre>pnpm add @conversation-platform/sdk</pre>
          <h3 className="text-lg font-medium">yarn</h3>
          <pre>yarn add @conversation-platform/sdk</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Configuration</h2>
        <p>
          Create a <code className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">.env</code>{' '}
          file in your project root with your API credentials:
        </p>
        <pre>
{`CONVERSATION_PLATFORM_API_KEY=cp_live_your_api_key_here
CONVERSATION_PLATFORM_API_URL=https://api.conversation-platform.dev`}
        </pre>
        <p>You can obtain an API key from the dashboard under Settings &gt; API Keys.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Initialize the Client</h2>
        <pre>
{`import { ConversationPlatform } from '@conversation-platform/sdk';

const client = new ConversationPlatform({
  apiKey: process.env.CONVERSATION_PLATFORM_API_KEY,
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Your First Request</h2>
        <p>List your channels:</p>
        <pre>
{`const channels = await client.channels.list();

console.log(channels);
// [{ id: "ch_abc123", type: "whatsapp", name: "Support", ... }]`}
        </pre>
        <p>Create a conversation:</p>
        <pre>
{`const conversation = await client.conversations.create({
  channelId: 'ch_abc123',
  participantId: 'user_123',
  metadata: { source: 'website' },
});

console.log(conversation.id); // "conv_xyz789"`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Project Structure</h2>
        <p>The SDK is organized into logical modules:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>channels</strong> — Manage messaging channels (WhatsApp, Slack, etc.)</li>
          <li><strong>conversations</strong> — Create and manage conversations</li>
          <li><strong>messages</strong> — Send and receive messages</li>
          <li><strong>webhooks</strong> — Set up event-driven integrations</li>
          <li><strong>integrations</strong> — Connect third-party services</li>
          <li><strong>knowledge</strong> — Manage knowledge bases for AI responses</li>
          <li><strong>workflows</strong> — Automate conversation flows</li>
          <li><strong>analytics</strong> — Access usage and performance data</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Next Steps</h2>
        <div className="flex flex-col gap-2">
          <Link href="/guides/authentication" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            Learn about authentication <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/api/channels" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            Explore the Channels API <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/guides/channel-setup" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            Set up your first channel <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
