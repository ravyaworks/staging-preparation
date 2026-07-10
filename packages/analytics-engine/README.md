# @conversation-platform/analytics-engine

Event-driven analytics engine tracking conversation, workflow, knowledge, tool, provider usage, latency, errors, and custom business metrics with aggregation and querying.

## Responsibilities
- Track typed analytics events across 20+ event types (conversation, workflow, knowledge, tool, provider, tokens, latency, errors, user, tenant, business)
- Record numeric metrics with label-based filtering for custom monitoring
- Query events by type, tenant, user, source, and date range with pagination
- Aggregate event counts with sum, average, min, max per time period
- Compute conversation stats, token usage by provider, and error rates per tenant

## Dependencies
- `@conversation-platform/database`, `@conversation-platform/types`
- `@conversation-platform/logger`, `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`AnalyticsEngine` class with `track`, `trackMetric`, `query`, `aggregate`, `getMetrics`, `getConversationStats`, `getTokenUsage`, and `getErrorRate`. Exports `AnalyticsEvent`, `AnalyticsEventType`, `Metric`, `AnalyticsAggregation`, and `AnalyticsQuery`.

## Extension Points
Add new `AnalyticsEventType` values for domain-specific tracking; replace in-memory storage with a time-series database by providing a persistent backend.

## Future
Add real-time streaming analytics, dashboard-friendly pre-aggregated rollups, and automated anomaly detection on metric thresholds.
