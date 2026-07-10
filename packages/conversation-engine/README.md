# @conversation-platform/conversation-engine

Top-level conversation lifecycle orchestrator that wires together AI, prompt, memory, and context engines.

## Responsibilities
- `createConversationEngine` — factory that composes `AIEngine`, `PromptRegistry`, `MemoryManager`, `ContextManager`, and `ConversationStateManager`
- Conversation lifecycle — create, sendMessage, updateStatus (active/paused/resolved/closed), filter, stats
- `ResponsePipeline` — processes each user message through the full pipeline: compile system prompt, retrieve memory history, call AI engine, persist user + assistant entries
- `ConversationStateManager` — per-conversation state tracking (status, processing flag, current step, arbitrary metadata)
- Error handling: rejects messages on closed conversations, surfaces `AIEngineError` and `ConversationError`

## Dependencies
- `@conversation-platform/ai-engine`, `@conversation-platform/prompt-engine`, `@conversation-platform/memory-engine`, `@conversation-platform/context-engine`, `@conversation-platform/logger`

## Public API
Exports `createConversationEngine` (returns `{ createConversation, sendMessage, getConversation, updateConversationStatus, listConversations, getConversationStats, getStateManager }`), `ConversationStateManager`, and `createResponsePipeline`.

## Future
Add middleware hooks into the response pipeline for custom pre/post processing, and built-in conversation reporting with export to JSON/CSV.
