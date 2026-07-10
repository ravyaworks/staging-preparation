# @conversation-platform/memory-engine

Conversation memory management with a pluggable storage interface.

## Responsibilities
- `MemoryStore` interface — abstract persistence for entries, conversation memories, session memories, tenant memories, and user preferences
- `InMemoryMemoryStore` — default ephemeral implementation backed by `Map`
- `MemoryManager` — high-level CRUD for conversation history (`addEntry`, `getHistory`, `setSummary`, `getSummary`), with configurable `maxEntriesPerConversation`
- Memory models: `MemoryEntry`, `ConversationMemory`, `SessionMemory`, `TenantMemory`, `UserPreferences`
- `MemoryQuery` — filter entries by conversation, user, session, date range, and limit
- `MemoryStats` — aggregate statistics (total entries, conversations, tokens, date range)

## Dependencies
- None (zero internal dependencies)

## Public API
Exports `MemoryStore` interface, `InMemoryMemoryStore`, `MemoryManager`, and all memory types (`MemoryEntry`, `ConversationMemory`, `SessionMemory`, `TenantMemory`, `UserPreferences`, `MemoryQuery`, `MemoryStats`).

## Future
Add a Redis-backed `MemoryStore` implementation and automatic conversation summarization when entry count exceeds the threshold.
