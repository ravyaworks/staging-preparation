import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Analytics API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access usage metrics, performance data, and conversation analytics.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/analytics</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <pre>
{`GET /v1/analytics/overview?period=7d`}
        </pre>
        <h3 className="text-lg font-medium">Query Parameters</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm">
          <li><code>period</code> — <code>1d</code>, <code>7d</code>, <code>30d</code>, <code>90d</code>, or custom <code>startDate/endDate</code></li>
          <li><code>channelId</code> — Filter by specific channel</li>
        </ul>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "period": { "start": "2024-06-24T00:00:00Z", "end": "2024-07-01T00:00:00Z" },
  "conversations": {
    "total": 1250,
    "new": 420,
    "active": 34,
    "closed": 1216,
    "averageDuration": 342
  },
  "messages": {
    "total": 8900,
    "incoming": 4300,
    "outgoing": 4600,
    "averageResponseTime": 45
  },
  "channels": [
    { "channelId": "ch_abc", "type": "whatsapp", "conversations": 800 },
    { "channelId": "ch_def", "type": "website", "conversations": 450 }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Conversation Metrics</h2>
        <pre>
{`GET /v1/analytics/conversations?period=30d&groupBy=day`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "date": "2024-06-01",
      "total": 42,
      "new": 15,
      "closed": 12,
      "averageDuration": 320
    },
    {
      "date": "2024-06-02",
      "total": 38,
      "new": 12,
      "closed": 14,
      "averageDuration": 290
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Agent Performance</h2>
        <pre>
{`GET /v1/analytics/agents?period=30d`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "agentId": "agent_123",
      "name": "Support Bot",
      "conversationsHandled": 340,
      "averageResponseTime": 12,
      "satisfactionScore": 4.7,
      "resolutionRate": 0.89
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Channel Metrics</h2>
        <pre>
{`GET /v1/analytics/channels?period=30d`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "channelId": "ch_abc",
      "type": "whatsapp",
      "name": "Support",
      "conversations": 800,
      "messages": 4200,
      "averageResponseTime": 38,
      "peakHour": 14
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Export Report</h2>
        <pre>
{`POST /v1/analytics/export
Content-Type: application/json

{
  "type": "conversations",
  "period": "30d",
  "format": "csv",
  "filters": {
    "channelId": "ch_abc",
    "status": "closed"
  }
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "exportId": "exp_xyz",
  "status": "processing",
  "downloadUrl": null,
  "expiresAt": "2024-07-02T12:00:00Z"
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">AI Metrics</h2>
        <pre>
{`GET /v1/analytics/ai?period=7d`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "totalQueries": 2100,
  "autoResolved": 1680,
  "escalated": 420,
  "averageConfidence": 0.87,
  "knowledgeHitRate": 0.73,
  "modelUsage": {
    "gpt-4o": 1200,
    "gpt-4o-mini": 900
  }
}`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/workflows" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Workflows
        </Link>
        <Link href="/sdk/core" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          SDK: Core <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
