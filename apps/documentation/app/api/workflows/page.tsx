import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function WorkflowsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Workflows API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Automate conversation flows with trigger-based workflows.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/workflows</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Workflows</h2>
        <pre>
{`GET /v1/workflows`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "wf_abc123",
      "name": "Welcome Sequence",
      "description": "Automated onboarding flow for new users",
      "status": "active",
      "trigger": {
        "type": "conversation.created",
        "filter": { "channelType": "website" }
      },
      "stepCount": 5,
      "executionCount": 342,
      "createdAt": "2024-04-15T10:00:00Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Workflow</h2>
        <pre>
{`POST /v1/workflows
Content-Type: application/json

{
  "name": "Welcome Sequence",
  "description": "Automated onboarding flow for new users",
  "trigger": {
    "type": "conversation.created",
    "filter": { "channelType": "website" }
  },
  "steps": [
    {
      "id": "step_1",
      "type": "send_message",
      "config": {
        "content": "Welcome! How can we help you today?",
        "delay": 0
      }
    },
    {
      "id": "step_2",
      "type": "wait_for_input",
      "config": {
        "timeout": 300,
        "fallbackStepId": "step_3"
      }
    },
    {
      "id": "step_3",
      "type": "send_message",
      "config": {
        "content": "It looks like you need some time. Feel free to ask anytime!"
      }
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get Workflow</h2>
        <pre>
{`GET /v1/workflows/:id`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Update Workflow</h2>
        <pre>
{`PATCH /v1/workflows/:id
Content-Type: application/json

{
  "status": "paused",
  "steps": [...updated steps]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Workflow</h2>
        <pre>
{`DELETE /v1/workflows/:id`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Trigger Types</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>conversation.created</code> — When a new conversation starts</li>
          <li><code>message.received</code> — When a message is received</li>
          <li><code>message.sent</code> — When a message is sent</li>
          <li><code>conversation.closed</code> — When a conversation ends</li>
          <li><code>schedule</code> — Time-based trigger (cron)</li>
          <li><code>manual</code> — Triggered via API</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Step Types</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><code>send_message</code> — Send a message to the conversation</li>
          <li><code>wait_for_input</code> — Pause and wait for user input</li>
          <li><code>condition</code> — Branch based on conditions</li>
          <li><code>transfer</code> — Transfer to a specific agent or queue</li>
          <li><code>api_call</code> — Call an external API</li>
          <li><code>update_metadata</code> — Update conversation metadata</li>
          <li><code>end_conversation</code> — Close the conversation</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Execute Workflow</h2>
        <pre>
{`POST /v1/workflows/:id/execute
Content-Type: application/json

{
  "conversationId": "conv_abc123",
  "context": {
    "userName": "Jane",
    "language": "en"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Executions</h2>
        <pre>
{`GET /v1/workflows/:id/executions?limit=10`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "exec_xyz",
      "workflowId": "wf_abc123",
      "conversationId": "conv_abc",
      "status": "completed",
      "currentStep": null,
      "startedAt": "2024-07-01T14:00:00Z",
      "completedAt": "2024-07-01T14:02:30Z"
    }
  ]
}`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/knowledge" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Knowledge
        </Link>
        <Link href="/api/analytics" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Analytics <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
