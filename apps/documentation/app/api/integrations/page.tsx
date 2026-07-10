import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Integrations API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect third-party services and manage integration lifecycle.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/integrations</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Integrations</h2>
        <pre>
{`GET /v1/integrations`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "int_abc123",
      "type": "zendesk",
      "name": "Zendesk Support",
      "status": "active",
      "config": {
        "subdomain": "yourcompany",
        "syncEnabled": true
      },
      "createdAt": "2024-02-20T11:00:00Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Integration</h2>
        <pre>
{`POST /v1/integrations
Content-Type: application/json

{
  "type": "zendesk",
  "name": "Zendesk Support",
  "config": {
    "subdomain": "yourcompany",
    "apiToken": "zd_token_xxx",
    "syncEnabled": true,
    "syncInterval": 300
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "int_def456",
  "type": "zendesk",
  "name": "Zendesk Support",
  "status": "configuring",
  "config": {
    "subdomain": "yourcompany",
    "syncEnabled": true
  },
  "createdAt": "2024-07-01T14:00:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get Integration</h2>
        <pre>
{`GET /v1/integrations/:id`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Update Integration</h2>
        <pre>
{`PATCH /v1/integrations/:id
Content-Type: application/json

{
  "status": "active",
  "config": {
    "syncEnabled": false
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Integration</h2>
        <pre>
{`DELETE /v1/integrations/:id`}
        </pre>
        <p>Returns <code>204 No Content</code> on success.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Supported Integration Types</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>zendesk</code> — Zendesk Support ticket sync</li>
          <li><code>salesforce</code> — Salesforce CRM integration</li>
          <li><code>hubspot</code> — HubSpot CRM sync</li>
          <li><code>intercom</code> — Intercom messenger</li>
          <li><code>stripe</code> — Payment processing</li>
          <li><code>github</code> — GitHub issue tracking</li>
          <li><code>jira</code> — Jira project management</li>
          <li><code>custom</code> — Custom integration via webhook</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Test Integration</h2>
        <pre>
{`POST /v1/integrations/:id/test`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "success": true,
  "latency": 234,
  "message": "Connection successful"
}`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/webhooks" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Webhooks
        </Link>
        <Link href="/api/conversations" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Conversations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
