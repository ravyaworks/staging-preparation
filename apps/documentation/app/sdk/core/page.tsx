import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SDKCorePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Core SDK</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The base client library for interacting with the Conversation Platform API.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <pre>npm install @conversation-platform/sdk</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Initialization</h2>
        <pre>
{`import { ConversationPlatform } from '@conversation-platform/sdk';

const client = new ConversationPlatform({
  apiKey: process.env.CONVERSATION_PLATFORM_API_KEY,
  baseUrl: 'https://api.conversation-platform.dev',
  timeout: 30000,
  retries: 3,
});`}
        </pre>
        <h3 className="text-lg font-medium">Options</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><code>apiKey</code> — Your API key (required)</li>
          <li><code>baseUrl</code> — Custom API URL (optional)</li>
          <li><code>timeout</code> — Request timeout in ms (default: 30000)</li>
          <li><code>retries</code> — Number of retries on failure (default: 3)</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Modules</h2>
        <pre>
{`client.channels       // Channel management
client.conversations  // Conversation CRUD
client.messages       // Send and list messages
client.webhooks       // Webhook management
client.integrations   // Third-party integrations
client.knowledge      // Knowledge base operations
client.workflows      // Workflow automation
client.analytics      // Usage and performance data`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Handling</h2>
        <pre>
{`import { ConversationPlatform, APIError } from '@conversation-platform/sdk';

try {
  const channels = await client.channels.list();
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.status);   // 404, 500, etc.
    console.error(error.message);  // Human-readable message
    console.error(error.code);     // Machine-readable code
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Pagination</h2>
        <pre>
{`const paginator = client.conversations.paginate({ limit: 25 });

for await (const conversation of paginator) {
  console.log(conversation.id);
}

// Or manual pagination
const page1 = await client.conversations.list({ limit: 25, offset: 0 });
const page2 = await client.conversations.list({ limit: 25, offset: 25 });`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">TypeScript Support</h2>
        <p>The SDK is fully typed. All methods return properly typed responses:</p>
        <pre>
{`import type {
  Channel,
  Conversation,
  Message,
  Webhook,
} from '@conversation-platform/sdk';

const channels: Channel[] = await client.channels.list();
const conversation: Conversation = await client.conversations.get('conv_abc');`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/analytics" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Analytics
        </Link>
        <Link href="/sdk/react" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          React SDK <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
