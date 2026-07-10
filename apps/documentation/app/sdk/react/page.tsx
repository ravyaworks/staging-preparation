import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SDKReactPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">React SDK</h1>
        <p className="text-gray-600 dark:text-gray-400">
          React hooks and components for building conversational interfaces.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <pre>npm install @conversation-platform/sdk-react</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Provider Setup</h2>
        <pre>
{`import { ConversationPlatformProvider } from '@conversation-platform/sdk-react';

function App() {
  return (
    <ConversationPlatformProvider apiKey={process.env.REACT_APP_CP_API_KEY}>
      <MyApp />
    </ConversationPlatformProvider>
  );
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">useConversation Hook</h2>
        <pre>
{`import { useConversation } from '@conversation-platform/sdk-react';

function ChatWidget() {
  const { messages, sendMessage, loading } = useConversation('conv_abc123');

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')}>
        Send
      </button>
    </div>
  );
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">useChannels Hook</h2>
        <pre>
{`import { useChannels } from '@conversation-platform/sdk-react';

function ChannelList() {
  const { channels, loading, error } = useChannels();

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {channels.map((ch) => (
        <li key={ch.id}>{ch.name} ({ch.type})</li>
      ))}
    </ul>
  );
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">useAnalytics Hook</h2>
        <pre>
{`import { useAnalytics } from '@conversation-platform/sdk-react';

function Dashboard() {
  const { overview, loading } = useAnalytics({ period: '7d' });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Total conversations: {overview.conversations.total}</p>
      <p>Avg response time: {overview.messages.averageResponseTime}s</p>
    </div>
  );
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">ChatWidget Component</h2>
        <pre>
{`import { ChatWidget } from '@conversation-platform/sdk-react';

function SupportPage() {
  return (
    <ChatWidget
      channelId="ch_abc123"
      position="bottom-right"
     主题="blue"
      welcomeMessage="Hi! How can we help?"
    />
  );
}`}
        </pre>
        <h3 className="text-lg font-medium">Props</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><code>channelId</code> — Channel to connect to</li>
          <li><code>position</code> — Widget position: <code>bottom-right</code>, <code>bottom-left</code></li>
          <li><code>welcomeMessage</code> — Initial greeting</li>
          <li><code>theme</code> — Color theme</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Real-time Updates</h2>
        <p>
          The React SDK automatically handles WebSocket connections for real-time message updates.
          No additional configuration is needed.
        </p>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/sdk/core" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Core SDK
        </Link>
        <Link href="/sdk/nextjs" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Next.js SDK <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
