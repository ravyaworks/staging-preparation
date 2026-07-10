# @conversation-platform/tool-engine

Generic tool registry, discovery, validation, and execution engine with retry logic, permission scoping, and capability-based lookup.

## Responsibilities
- Register/unregister tool definitions with typed parameter schemas and capability tags
- Execute tool handlers with automatic parameter validation and error handling
- Retry failed executions with configurable exponential backoff
- Look up tools by category or capability for dynamic discovery
- Track execution results with duration, success/failure, and metadata

## Dependencies
- `@conversation-platform/event-bus`, `@conversation-platform/types`
- `@conversation-platform/logger`, `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`ToolRegistry` (register, get, list, findByCapability), `ToolExecutor` (execute with retry), plus `ToolDefinition`, `ToolHandler`, `ToolExecutionRequest`, `ToolExecutionResult`, and `ToolParameter` types.

## Extension Points
Implement `ToolHandler` for any custom tool logic; add pre/post execution hooks via `event-bus`; extend parameter validation rules.

## Future
Add concurrent execution limits, distributed tool execution with queue routing, and OpenAPI schema generation from tool definitions.
