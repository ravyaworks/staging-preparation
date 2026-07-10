# @conversation-platform/notification-engine

Multi-channel notification engine supporting email, SMS, push, webhook, and in-app delivery with template rendering, retry logic, and pluggable channel providers.

## Responsibilities
- Send notifications through pluggable channel providers (email, SMS, push, webhook, in_app)
- Render `{{variable}}` templates with runtime data for dynamic content
- Manage notification lifecycle: queued → sent → delivered / failed with automatic retries
- Cancel pending notifications before delivery
- Create, list, update, and query notification templates per tenant

## Dependencies
- `@conversation-platform/queue`, `@conversation-platform/event-bus`
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`NotificationEngine` class with `send`, `sendFromTemplate`, `cancel`, `registerChannel`, `registerTemplate`, `list`, and `listTemplates`. Exports `Notification`, `NotificationTemplate`, `NotificationChannelProvider`, `NotificationDeliveryResult`, and `createStubChannelProvider`.

## Extension Points
Implement `NotificationChannelProvider` for any delivery backend (SendGrid, Twilio, Firebase); add new channels to the `NotificationChannel` union type.

## Future
Add batched notification sending, delivery receipt webhooks, priority-based queuing, and suppression rules (rate limits, quiet hours).
