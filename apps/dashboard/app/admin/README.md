# Admin Console

System administration interface for platform-wide management. Accessible by super_admin and admin roles.

## Features

- **Tenant Management** — Create, edit, suspend, and delete tenants. View usage metrics and subscription status.
- **User Management** — Manage all platform users across tenants. Assign roles, reset passwords, and control access.
- **Roles & Permissions** — Define RBAC policies with granular permission sets. Create custom roles for different access levels.
- **System Settings** — Configure global platform settings, feature flags, rate limits, and security policies.
- **Audit Log** — Searchable, filterable audit trail of all administrative actions across the platform.
- **Platform Analytics** — Aggregate metrics across all tenants: active conversations, message volume, user counts, and system health.

## Architecture

The admin console is organized as sub-routes under `/admin/{tenants,users,roles,settings,audit,analytics}`. Each section shares a common layout with role-based sidebar navigation.

## Dependencies

- Session store for authentication state
- API client (`lib/api-client.ts`) for platform-level API calls
- Shared layout components (`DashboardLayout`, `PageHeader`, `Sidebar`)
- Analytics components (`StatCard`, `BarChart`, `PieChart`)

## Future Extensions

- Bulk tenant operations (import/export)
- Advanced analytics dashboards with custom date ranges
- Webhook management for platform events
- Maintenance mode controls
- System health monitoring dashboard
