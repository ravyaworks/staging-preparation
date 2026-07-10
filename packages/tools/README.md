# @conversation-platform/tools

Default tool definitions for Calendar, CRM, Email, HTTP, Database, Storage, Search, Webhook, Notification, Lead Capture, Task Management, and Document Reader — each with typed parameter schemas and capability metadata.

## Responsibilities
- Provide factory functions creating `ToolDefinition` objects for 12 built-in tool categories
- Define standard parameter contracts (action, IDs, content, pagination) per tool
- Categorize tools (calendar, crm, email, http, database, storage, search, etc.) for discovery
- Supply a default stub handler with validation for quick prototyping
- Export a single `getAllDefaultToolDefs()` to bootstrap the tool registry

## Dependencies
- `@conversation-platform/tool-engine`, `@conversation-platform/storage`
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
Factory functions (`createCalendarToolDef`, `createEmailToolDef`, etc.), `getAllDefaultToolDefs()`, `createDefaultToolHandlerStub()`, and the `ToolCategories` constant object.

## Extension Points
Add new tool definitions by following the factory pattern; replace the stub handler with real provider-backed implementations per tool category.

## Future
Add tool definition versioning and migration, auto-generated OpenAPI specs from definitions, and marketplace-style third-party tool packages.
