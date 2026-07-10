import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ConversationsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Conversations API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create, list, retrieve, and manage conversations across channels.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/conversations</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Conversations</h2>
        <pre>
{`GET /v1/conversations?channelId=ch_abc&status=open&limit=25`}
        </pre>
        <h3 className="text-lg font-medium">Query Parameters</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><code>channelId</code> — Filter by channel</li>
          <li><code>status</code> — <code>open</code>, <code>closed</code>, <code>pending</code></li>
          <li><code>participantId</code> — Filter by participant</li>
          <li><code>createdAfter</code> — ISO 8601 timestamp</li>
          <li><code>limit</code> — Number of results (default 25, max 100)</li>
          <li><code>offset</code> — Pagination offset</li>
        </ul>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "conv_abc123",
      "channelId": "ch_xyz",
      "status": "open",
      "participants": [
        { "id": "user_1", "name": "Jane Doe", "role": "customer" }
      ],
      "lastMessage": {
        "content": "I need help with my order",
        "timestamp": "2024-07-01T14:30:00Z"
      },
      "createdAt": "2024-07-01T14:00:00Z"
    }
  ],
  "total": 42,
  "hasMore": true
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Conversation</h2>
        <pre>
{`POST /v1/conversations
Content-Type: application/json

{
  "channelId": "ch_abc123",
  "participantId": "user_456",
  "topic": "Order Support",
  "metadata": {
    "orderId": "ORD-789",
    "source": "website_widget"
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "conv_new123",
  "channelId": "ch_abc123",
  "status": "open",
  "participants": [
    { "id": "user_456", "name": "John Smith", "role": "customer" }
  ],
  "topic": "Order Support",
  "createdAt": "2024-07-01T15:00:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get Conversation</h2>
        <pre>
{`GET /v1/conversations/:id`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "conv_abc123",
  "channelId": "ch_xyz",
  "status": "open",
  "participants": [...],
  "messages": [
    {
      "id": "msg_1",
      "content": "Hello!",
      "direction": "incoming",
      "timestamp": "2024-07-01T14:00:00Z"
    }
  ],
  "metadata": {},
  "createdAt": "2024-07-01T14:00:00Z",
  "updatedAt": "2024-07-01T14:30:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Update Conversation</h2>
        <pre>
{`PATCH /v1/conversations/:id
Content-Type: application/json

{
  "status": "closed",
  "topic": "Resolved - Order Issue",
  "metadata": {
    "resolvedBy": "agent_123",
    "resolution": "refund"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Conversation</h2>
        <pre>
{`DELETE /v1/conversations/:id`}
        </pre>
        <p>
          Permanently deletes the conversation and all associated messages.
          Returns <code>204 No Content</code> on success.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Add Participant</h2>
        <pre>
{`POST /v1/conversations/:id/participants
Content-Type: application/json

{
  "participantId": "agent_789",
  "role": "agent"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Transfer Conversation</h2>
        <pre>
{`POST /v1/conversations/:id/transfer
Content-Type: application/json

{
  "fromAgentId": "agent_123",
  "toAgentId": "agent_456",
  "reason": "Specialized support needed"
}`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/integrations" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Integrations
        </Link>
        <Link href="/api/messages" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Messages <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
