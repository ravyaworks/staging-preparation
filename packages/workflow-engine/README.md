# @conversation-platform/workflow-engine

Workflow execution engine supporting multi-step definitions with conditions, rules, triggers, scheduling, step-by-step execution tracking, and failure recovery.

## Responsibilities
- Define and manage workflows with typed steps (condition, action, trigger, delay, loop, rule)
- Execute workflows sequentially, evaluating conditions and nested rule priorities
- Track step-level execution results, duration, and overall workflow status
- Register manual, webhook, schedule, event, and condition-based triggers
- Schedule workflows via cron expressions with timezone support
- Recover failed executions and compute per-workflow metrics (completion rate, avg duration)

## Dependencies
- `@conversation-platform/event-bus`, `@conversation-platform/queue`
- `@conversation-platform/types`, `@conversation-platform/logger`
- `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`WorkflowEngine` class with `createDefinition`, `execute`, `recover`, `registerTrigger`, `schedule`, `getMetrics`, and step type handling. Exports `WorkflowDefinition`, `WorkflowStep`, `WorkflowExecution`, `WorkflowRule`, `WorkflowCondition`, and trigger/schedule types.

## Extension Points
Add custom step types by extending the `WorkflowStepType` union and handling them in `executeStep`; wire `event-bus` for event-driven triggers.

## Future
Add parallel step execution, sub-workflow composition, a visual workflow builder, and a persistent execution state store.
