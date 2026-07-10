# Tenant Dashboard

Organization-level dashboard for tenant administrators. Provides tools for day-to-day management of AI conversations, knowledge, workflows, and team members.

## Features

- **Knowledge Management** — Upload, organize, and manage knowledge libraries that power AI responses.
- **Conversations** — View, monitor, and intervene in active conversations across all channels.
- **Workflows** — Design and manage conversational workflows that define AI behavior and routing logic.
- **Team Management** — Invite team members, assign roles, and manage access within the tenant.
- **Tenant Analytics** — Tenant-specific metrics including conversation volume, resolution rates, and channel distribution.
- **Tenant Settings** — Configure branding, channel connections, notification preferences, and billing information.

## Architecture

The tenant dashboard is organized as sub-routes under `/tenant/{knowledge,conversations,workflows,team,analytics,settings}`. Each section shares a common layout with tenant-specific sidebar navigation.

## Dependencies

- API client for tenant-scoped API calls
- State stores for current tenant context
- Shared UI components from the component library
- Analytics chart components for reporting

## Future Extensions

- Multi-language knowledge base support
- Advanced workflow templates and marketplace
- SLA monitoring and alerting
- Custom dashboard widgets
- Third-party integration management
