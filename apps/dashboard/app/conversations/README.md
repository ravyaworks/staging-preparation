# Conversation Interface

Real-time messaging interface for interacting with AI agents and human participants across all connected channels.

## Features

- **Chat UI** — Full-featured messaging interface with support for text, images, files, and rich media.
- **Streaming Responses** — Real-time streaming of AI-generated responses with cursor indicators.
- **Markdown Rendering** — Rich markdown support including code blocks, tables, lists, and inline formatting.
- **Message Actions** — Reply, edit, delete, copy, and forward messages. React with emoji reactions.
- **Conversation Management** — Create, search, filter, and archive conversations. Assign conversations to team members.
- **Multi-Channel View** — Unified inbox showing conversations from web, WhatsApp, Instagram, Messenger, and other channels.

## Architecture

The conversation interface lives at `/conversations` with a sub-route for creating new conversations (`/conversations/new`). It uses WebSocket connections for real-time updates and depends on the shared chat components in `components/chat/`.

## Dependencies

- Chat components (`ChatContainer`, `ChatMessage`, `ChatInput`, `ConversationSidebar`)
- WebSocket or SSE client for real-time messaging
- Markdown renderer for message display
- API client for conversation CRUD operations

## Future Extensions

- Conversation tagging and categorization
- Saved search filters and smart folders
- Bulk message actions
- Conversation quality scoring
- Handoff to human agents with context transfer
- Audio/video call integration
