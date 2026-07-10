import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ChannelSetupGuidePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Channel Setup</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Step-by-step guides for connecting messaging channels.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">WhatsApp Business</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create a WhatsApp Business account at <code>business.facebook.com</code></li>
          <li>Set up the WhatsApp Business API or use a BSP (Business Solution Provider)</li>
          <li>Get your Phone Number ID and WABA ID from the Meta dashboard</li>
          <li>Create a channel via the API:</li>
        </ol>
        <pre>
{`POST /v1/channels
{
  "type": "whatsapp",
  "name": "Customer Support",
  "config": {
    "phoneNumberId": "your_phone_number_id",
    "wabaId": "your_waba_id",
    "accessToken": "your_access_token",
    "verifyToken": "your_custom_verify_token"
  }
}`}
        </pre>
        <ol className="list-decimal space-y-2 pl-6" start={5}>
          <li>Configure the webhook URL in the Meta dashboard to point to your platform webhook endpoint</li>
          <li>Verify the webhook by completing the challenge handshake</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Telegram</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create a bot via <code>@BotFather</code> on Telegram</li>
          <li>Copy the bot token</li>
          <li>Create a channel:</li>
        </ol>
        <pre>
{`POST /v1/channels
{
  "type": "telegram",
  "name": "Support Bot",
  "config": {
    "botToken": "your_bot_token",
    "webhookUrl": "https://your-app.com/webhooks/telegram"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Slack</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create a Slack App at <code>api.slack.com/apps</code></li>
          <li>Enable Events and subscribe to message channels</li>
          <li>Set the Request URL to your webhook endpoint</li>
          <li>Create a channel:</li>
        </ol>
        <pre>
{`POST /v1/channels
{
  "type": "slack",
  "name": "Team Channel",
  "config": {
    "botToken": "xoxb-your-bot-token",
    "appToken": "xapp-your-app-token",
    "signingSecret": "your_signing_secret"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Discord</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create a Discord Application at <code>discord.com/developers</code></li>
          <li>Create a bot and copy the token</li>
          <li>Invite the bot to your server</li>
          <li>Create a channel:</li>
        </ol>
        <pre>
{`POST /v1/channels
{
  "type": "discord",
  "name": "Community Bot",
  "config": {
    "botToken": "your_discord_bot_token",
    "guildId": "your_server_id",
    "applicationId": "your_application_id"
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Website Widget</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Create a website channel:</li>
        </ol>
        <pre>
{`POST /v1/channels
{
  "type": "website",
  "name": "Website Chat",
  "config": {
    "allowedOrigins": ["https://your-site.com"],
    "theme": "blue",
    "position": "bottom-right"
  }
}`}
        </pre>
        <ol className="list-decimal space-y-2 pl-6" start={2}>
          <li>Add the widget script to your website:</li>
        </ol>
        <pre>
{`<script
  src="https://cdn.conversation-platform.dev/widget.js"
  data-channel-id="ch_abc123"
  data-position="bottom-right"
  async
></script>`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Email (SMTP)</h2>
        <pre>
{`POST /v1/channels
{
  "type": "email",
  "name": "Support Email",
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "support@yourcompany.com",
    "password": "your_app_password",
    "fromAddress": "support@yourcompany.com",
    "monitorInbox": true
  }
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Testing Your Channel</h2>
        <pre>
{`# Send a test message
curl -X POST https://api.conversation-platform.dev/v1/channels/:id/test \\
  -H "Authorization: Bearer cp_live_your_key" \\
  -H "Content-Type: application/json"`}
        </pre>
        <p>Check the dashboard for channel status and recent messages.</p>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/guides/webhook-security" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Webhook Security
        </Link>
        <Link href="/guides/integrations" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Integrations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
