# @conversation-platform/audit

Immutable audit trail tracking create, update, delete, read, execute, and configuration changes across knowledge, workflow, tool, plugin, user, system, tenant, notification, and analytics resources.

## Responsibilities
- Record auditable actions with full change diffs (field, old value, new value)
- Query audit entries by action type, resource type, resource ID, tenant, user, and date range
- Retrieve audit history scoped to a specific resource, tenant, or user
- Compute per-resource-type audit statistics for compliance reporting
- Support simple action recording and detailed change tracking

## Dependencies
- `@conversation-platform/database`, `@conversation-platform/types`
- `@conversation-platform/logger`, `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`AuditSystem` class with `record`, `recordChange`, `recordSimple`, `query`, `getByResource`, `getByTenant`, `getByUser`, and `getStats`. Exports `AuditEntry`, `AuditChange`, `AuditAction`, `AuditResourceType`, and `AuditQuery`.

## Extension Points
Add new `AuditAction` or `AuditResourceType` values for domain-specific auditing; replace in-memory storage with an append-only database table.

## Future
Add audit log retention policies, export to compliance formats (CSV, JSON), and webhook-based audit alerting for sensitive actions.
