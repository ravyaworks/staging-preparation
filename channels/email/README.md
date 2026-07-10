# @conversation-platform/channel-email

Email channel integration for the Conversation Platform.

## Features

- Multi-provider support: SendGrid, AWS SES, SMTP
- Incoming email processing via webhooks
- Outgoing email sending
- Rich text (HTML) email support
- File attachments
- Email threading via In-Reply-To / References headers
- IMAP integration for incoming mail (future)
- Template support

## Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `'sendgrid' \| 'ses' \| 'smtp'` | Yes | Email provider |
| `apiKey` | `string` | For SendGrid/SES | Provider API key |
| `fromAddress` | `string` | Yes | Default sender email address |
| `fromName` | `string` | No | Default sender name |
| `smtpHost` | `string` | For SMTP | SMTP server host |
| `smtpPort` | `number` | No | SMTP server port |
| `smtpUser` | `string` | No | SMTP username |
| `smtpPass` | `string` | No | SMTP password |
| `imapHost` | `string` | No | IMAP server host |
| `imapPort` | `number` | No | IMAP server port |
| `imapUser` | `string` | No | IMAP username |
| `imapPass` | `string` | No | IMAP password |

## Usage

```typescript
import { EmailChannel } from '@conversation-platform/channel-email'

const channel = new EmailChannel()
await channel.initialize({
  enabled: true,
  customConfig: {
    provider: 'sendgrid',
    apiKey: 'your-sendgrid-api-key',
    fromAddress: 'support@example.com',
    fromName: 'Support Team',
  },
})
```

## Capabilities

- Incoming: text, image, document, file
- Outgoing: text, image, document, file
- Supports replies and threading
- Maximum message length: 1,048,576 characters (1 MB)
- Maximum attachment size: 25 MB
