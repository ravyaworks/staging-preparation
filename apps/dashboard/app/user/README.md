# User Dashboard

Personal workspace for end users of the platform. Provides access to individual conversations, notifications, profile settings, and account management.

## Features

- **Personal Conversations** — View and participate in assigned conversations across channels.
- **Notifications** — Real-time notification feed with read/unread tracking and filtering.
- **Profile & Preferences** — Update personal information, avatar, language preferences, and notification settings.
- **Security Settings** — Change password, configure two-factor authentication, and review active sessions.

## Architecture

The user dashboard is organized under `/user/{conversations,notifications,settings}`. Each section is scoped to the authenticated user and does not require tenant-level or admin-level permissions.

## Dependencies

- Auth store for user session and identity
- Notifications store for real-time updates
- API client for user-scoped API calls
- Chat components for conversation interface

## Future Extensions

- Personal analytics dashboard (message counts, response times)
- Conversation history export
- Saved replies and templates
- Availability status management
- Integration with personal calendar and scheduling
