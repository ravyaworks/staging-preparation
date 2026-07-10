import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Messages API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send, receive, and broadcast messages across channels.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/messages</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Send Message</h2>
        <pre>
{`POST /v1/messages
Content-Type: application/json

{
  "conversationId": "conv_abc123",
  "content": "Your order has been shipped!",
  "type": "text",
  "metadata": {
    "templateName": "order_update",
    "language": "en"
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "id": "msg_xyz789",
  "conversationId": "conv_abc123",
  "content": "Your order has been shipped!",
  "type": "text",
  "direction": "outgoing",
  "status": "sent",
  "createdAt": "2024-07-01T16:00:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Message Types</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>text</code> — Plain text message</li>
          <li><code>image</code> — Image with optional caption</li>
          <li><code>video</code> — Video with optional caption</li>
          <li><code>audio</code> — Audio file</li>
          <li><code>document</code> — Document or file attachment</li>
          <li><code>template</code> — Pre-defined message template</li>
          <li><code>interactive</code> — Buttons, lists, or quick replies</li>
          <li><code>location</code> — Geographic location</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Send Rich Message</h2>
        <pre>
{`POST /v1/messages
Content-Type: application/json

{
  "conversationId": "conv_abc123",
  "type": "interactive",
  "content": {
    "header": "Choose an option",
    "body": "How can we help you today?",
    "buttons": [
      { "id": "btn_1", "title": "Track Order" },
      { "id": "btn_2", "title": "Talk to Agent" },
      { "id": "btn_3", "title": "FAQ" }
    ]
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Messages</h2>
        <pre>
{`GET /v1/messages?conversationId=conv_abc123&limit=50`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "msg_1",
      "conversationId": "conv_abc123",
      "content": "Hello!",
      "type": "text",
      "direction": "incoming",
      "sender": { "id": "user_456", "name": "Jane" },
      "createdAt": "2024-07-01T14:00:00Z"
    },
    {
      "id": "msg_2",
      "conversationId": "conv_abc123",
      "content": "Hi! How can I help?",
      "type": "text",
      "direction": "outgoing",
      "sender": { "id": "agent_123", "name": "Support Bot" },
      "createdAt": "2024-07-01T14:00:05Z"
    }
  ],
  "hasMore": false
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Broadcast Message</h2>
        <p>Send a message to multiple conversations at once.</p>
        <pre>
{`POST /v1/messages/broadcast
Content-Type: application/json

{
  "channelId": "ch_abc123",
  "content": "System maintenance at 2 AM UTC",
  "type": "text",
  "filter": {
    "status": "open",
    "participantCount": { "min": 1 }
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "broadcastId": "bc_xyz",
  "totalRecipients": 150,
  "status": "queued"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get Message</h2>
        <pre>
{`GET /v1/messages/:id`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Message Status</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>queued</code> — Message is queued for delivery</li>
          <li><code>sent</code> — Message was sent to the channel</li>
          <li><code>delivered</code> — Message was delivered to the recipient</li>
          <li><code>read</code> — Message was read by the recipient</li>
          <li><code>failed</code> — Message delivery failed</li>
        </ul>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/conversations" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Conversations
        </Link>
        <Link href="/api/knowledge" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Knowledge <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
