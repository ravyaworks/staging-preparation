import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ChannelsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Channels API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage messaging channels — create, configure, list, and delete channels across platforms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/channels</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Channels</h2>
        <p>Retrieve all channels for your organization.</p>
        <h3 className="text-lg font-medium">Request</h3>
        <pre>
{`GET /v1/channels?status=active&limit=20&offset=0`}
        </pre>
        <h3 className="text-lg font-medium">Query Parameters</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><code>status</code> — Filter by status: <code>active</code>, <code>inactive</code>, <code>pending</code></li>
          <li><code>type</code> — Filter by type: <code>whatsapp</code>, <code>telegram</code>, <code>slack</code>, etc.</li>
          <li><code>limit</code> — Number of results (default 20, max 100)</li>
          <li><code>offset</code> — Pagination offset</li>
        </ul>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "ch_abc123",
      "type": "whatsapp",
      "name": "Customer Support",
      "status": "active",
      "config": {
        "phoneNumberId": "+1234567890",
        "wabaId": "waba_xyz"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-06-20T14:22:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Channel</h2>
        <p>Register a new messaging channel.</p>
        <h3 className="text-lg font-medium">Request</h3>
        <pre>
{`POST /v1/channels
Content-Type: application/json

{
  "type": "whatsapp",
  "name": "Sales Channel",
  "config": {
    "phoneNumberId": "+1234567890",
    "wabaId": "waba_xyz",
    "accessToken": "your_access_token"
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "ch_def456",
  "type": "whatsapp",
  "name": "Sales Channel",
  "status": "pending",
  "config": {
    "phoneNumberId": "+1234567890",
    "wabaId": "waba_xyz"
  },
  "createdAt": "2024-07-01T09:00:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get Channel</h2>
        <pre>
{`GET /v1/channels/:id`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "ch_abc123",
  "type": "whatsapp",
  "name": "Customer Support",
  "status": "active",
  "metrics": {
    "totalConversations": 1250,
    "activeConversations": 34
  },
  "createdAt": "2024-01-15T10:30:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Update Channel</h2>
        <pre>
{`PATCH /v1/channels/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Channel</h2>
        <pre>
{`DELETE /v1/channels/:id`}
        </pre>
        <p>Returns <code>204 No Content</code> on success.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Supported Channel Types</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>whatsapp</code> — WhatsApp Business API</li>
          <li><code>telegram</code> — Telegram Bot API</li>
          <li><code>slack</code> — Slack App</li>
          <li><code>discord</code> — Discord Bot</li>
          <li><code>messenger</code> — Facebook Messenger</li>
          <li><code>instagram</code> — Instagram DM</li>
          <li><code>teams</code> — Microsoft Teams</li>
          <li><code>email</code> — Email (SMTP)</li>
          <li><code>sms</code> — SMS (Twilio)</li>
          <li><code>website</code> — Website Widget</li>
          <li><code>api</code> — Custom API Channel</li>
        </ul>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/getting-started" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Quick Start
        </Link>
        <Link href="/api/webhooks" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Webhooks <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
