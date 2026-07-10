import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SDKNextjsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Next.js SDK</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Server-side utilities and App Router integration for Next.js applications.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Installation</h2>
        <pre>npm install @conversation-platform/sdk-nextjs</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Server Client</h2>
        <pre>
{`// lib/cp.ts
import { ConversationPlatformServer } from '@conversation-platform/sdk-nextjs';

export const cp = new ConversationPlatformServer({
  apiKey: process.env.CONVERSATION_PLATFORM_API_KEY!,
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Route Handlers</h2>
        <pre>
{`// app/api/webhooks/conversation-platform/route.ts
import { cp } from '@/lib/cp';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('X-CP-Signature')!;

  const event = cp.webhooks.verify(body, signature);

  switch (event.type) {
    case 'message.received':
      await handleMessage(event.data);
      break;
    case 'conversation.created':
      await handleConversation(event.data);
      break;
  }

  return NextResponse.json({ received: true });
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Server Actions</h2>
        <pre>
{`// app/actions/chat.ts
'use server';

import { cp } from '@/lib/cp';

export async function getConversations(channelId: string) {
  return cp.conversations.list({ channelId, limit: 25 });
}

export async function sendMessage(conversationId: string, content: string) {
  return cp.messages.send({ conversationId, content, type: 'text' });
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Page Component Example</h2>
        <pre>
{`// app/dashboard/page.tsx
import { cp } from '@/lib/cp';

export default async function DashboardPage() {
  const channels = await cp.channels.list();
  const conversations = await cp.conversations.list({ limit: 10 });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{channels.length} channels active</p>
      <p>{conversations.total} conversations</p>
    </div>
  );
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Middleware</h2>
        <pre>
{`// middleware.ts
import { cpMiddleware } from '@conversation-platform/sdk-nextjs';

export const middleware = cpMiddleware({
  webhooksPath: '/api/webhooks/conversation-platform',
});`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Environment Variables</h2>
        <pre>
{`# .env.local
CONVERSATION_PLATFORM_API_KEY=cp_live_xxx
CONVERSATION_PLATFORM_API_URL=https://api.conversation-platform.dev
CONVERSATION_PLATFORM_WEBHOOK_SECRET=whsec_xxx`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/sdk/react" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> React SDK
        </Link>
        <Link href="/sdk/node" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Node.js SDK <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
