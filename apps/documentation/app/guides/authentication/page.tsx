import Link from 'next/link';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export default function AuthenticationGuidePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Secure your API requests with API key authentication.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p>
          The Conversation Platform uses API keys to authenticate requests. You can create and
          manage API keys from the dashboard under <strong>Settings &gt; API Keys</strong>.
        </p>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="flex items-center gap-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            <Shield className="h-4 w-4" />
            Never expose your API key in client-side code. Always use environment variables.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">API Key Types</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Live keys</strong> (<code>cp_live_</code>) — For production use. Has full access
            to all endpoints.
          </li>
          <li>
            <strong>Test keys</strong> (<code>cp_test_</code>) — For development and testing. Uses
            sandbox data.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Using API Keys</h2>
        <h3 className="text-lg font-medium">Header Authentication</h3>
        <pre>
{`curl -X GET https://api.conversation-platform.dev/v1/channels \\
  -H "Authorization: Bearer cp_live_your_api_key_here" \\
  -H "Content-Type: application/json"`}
        </pre>

        <h3 className="text-lg font-medium">SDK Configuration</h3>
        <pre>
{`import { ConversationPlatform } from '@conversation-platform/sdk';

const client = new ConversationPlatform({
  apiKey: process.env.CONVERSATION_PLATFORM_API_KEY,
});`}
        </pre>

        <h3 className="text-lg font-medium">Environment Variables</h3>
        <pre>
{`# .env.local
CONVERSATION_PLATFORM_API_KEY=cp_live_your_api_key_here`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Key Scopes</h2>
        <p>API keys can be scoped to limit access:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>channels:read</code> — Read channel information</li>
          <li><code>channels:write</code> — Create and modify channels</li>
          <li><code>conversations:read</code> — Read conversations</li>
          <li><code>conversations:write</code> — Create and modify conversations</li>
          <li><code>messages:send</code> — Send messages</li>
          <li><code>webhooks:manage</code> — Manage webhooks</li>
          <li><code>analytics:read</code> — Read analytics data</li>
          <li><code>admin</code> — Full admin access</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Rate Limits</h2>
        <p>API keys have the following rate limits:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Standard:</strong> 100 requests per minute</li>
          <li><strong>Business:</strong> 1,000 requests per minute</li>
          <li><strong>Enterprise:</strong> Custom limits</li>
        </ul>
        <p>Rate limit headers are included in every response:</p>
        <pre>
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1719856800`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Responses</h2>
        <pre>
{`{
  "error": {
    "status": 401,
    "code": "UNAUTHORIZED",
    "message": "Invalid API key provided"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Rotate keys periodically</li>
          <li>Use environment variables, never hardcode keys</li>
          <li>Use scoped keys with minimum required permissions</li>
          <li>Use test keys during development</li>
          <li>Monitor API key usage in the dashboard</li>
        </ul>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/sdk/node" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Node.js SDK
        </Link>
        <Link href="/guides/webhook-security" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Webhook Security <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
