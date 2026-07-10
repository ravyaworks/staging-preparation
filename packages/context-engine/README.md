# @conversation-platform/context-engine

Multi-layered context management for conversations, tenants, users, sessions, and business data.

## Responsibilities
- Define typed context models: `ConversationContext`, `TenantContext`, `UserContext`, `SessionContext`, `MessageContext`, `BusinessContext`, `ConfigContext`
- `ContextManager` — in-memory store and retrieval for each context layer, plus `buildComposite` to assemble a full `CompositeContext`
- `compressMessages` — trim message history to fit a token budget (oldest messages dropped first)
- `summarizeContext` — produce a one-line text summary of a composite context
- `calculateTokenBudget` — simple helper to determine available tokens after reserving response capacity
- Builder functions for constructing each context type from partial params

## Dependencies
- None (zero internal dependencies)

## Public API
Exports builder functions (`buildConversationContext`, `buildTenantContext`, etc.), `ContextManager`, and compressor utilities (`compressMessages`, `summarizeContext`, `calculateTokenBudget`).

## Future
Add a persistence adapter interface for context snapshots, and a context diff tracker that records which fields changed between updates.
