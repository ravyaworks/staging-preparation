import Link from 'next/link';
import { ArrowRight, MessageSquare, Globe, Webhook, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Conversation Platform
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Build, integrate, and scale conversational experiences across every
          channel — web, mobile, social, and messaging platforms.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Quick Start</h2>
        <ol className="list-decimal space-y-3 pl-6 text-gray-700 dark:text-gray-300">
          <li>
            Install the SDK:{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
              npm install @conversation-platform/sdk
            </code>
          </li>
          <li>
            Configure your API key using environment variables
          </li>
          <li>
            Initialize the client and make your first API call
          </li>
        </ol>
        <Link
          href="/getting-started"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
        >
          Full quick start guide <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Architecture Overview</h2>
        <div className="rounded-lg border bg-gray-50 p-6 font-mono text-sm dark:border-gray-800 dark:bg-gray-900">
          <pre className="border-0 bg-transparent p-0 text-xs leading-relaxed sm:text-sm">
{`┌─────────────────────────────────────────────────────┐
│                  Clients / SDKs                     │
│     (React, Next.js, Node.js, Mobile, CLI)         │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   REST API                          │
│          /channels  /conversations  /messages       │
│          /webhooks  /integrations   /analytics      │
└───────┬─────────────────────────────────┬───────────┘
        │                                 │
        ▼                                 ▼
┌───────────────┐               ┌───────────────────┐
│   Services    │               │   Knowledge       │
│   (Channel,   │               │   Engine          │
│    Webhook,   │               │   (RAG, Embed,    │
│    Integr.)   │               │    Vector)        │
└───────┬───────┘               └─────────┬─────────┘
        │                                 │
        ▼                                 ▼
┌───────────────┐               ┌───────────────────┐
│   Channels    │               │   AI Engine       │
│  (WhatsApp,   │               │   (Prompts,       │
│   Telegram,   │               │    Context,       │
│   Slack, etc) │               │    Memory)        │
└───────────────┘               └───────────────────┘`}
          </pre>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Explore the Docs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/api/conversations"
            className="group rounded-lg border p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">API Reference</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Full reference for all REST API endpoints.
            </p>
          </Link>
          <Link
            href="/sdk/core"
            className="group rounded-lg border p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="mb-2 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">SDK Reference</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Client libraries for React, Next.js, and Node.js.
            </p>
          </Link>
          <Link
            href="/api/webhooks"
            className="group rounded-lg border p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="mb-2 flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Webhooks</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive real-time events from the platform.
            </p>
          </Link>
          <Link
            href="/guides/authentication"
            className="group rounded-lg border p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-600"
          >
            <div className="mb-2 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Guides</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step-by-step tutorials for common tasks.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
