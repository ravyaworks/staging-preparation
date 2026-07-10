# @conversation-platform/plugin-engine

Sandboxed execution engine for third-party extensions. Supports tool registration, workflow execution, and event-driven hooks.

## Sandboxed Execution

`PluginSandbox` provides an isolated execution context with:

- **Allowed API whitelist** — restricts runtime to safe globals: `console`, `JSON`, `Math`, `Date`, `Array`, `Object`, `String`, `Number`, `Promise`, `Map`, `Set`, `RegExp`, `Error`, `parseInt`, `parseFloat`, `encodeURI`, etc.
- **Timeout enforcement** — every handler is wrapped in `Promise.race` with a timeout (default 30s). Exceeding the timeout throws `PluginTimeoutError`.
- **Context creation** — `createContext(pluginId, tenantId)` generates a `PluginExecutionContext` with a unique requestId.

The sandbox can be replaced with a more restrictive implementation (e.g., `vm` module, Web Workers) via the `PluginSandbox` interface.

## Registration

Three extension points, all requiring plugin allowlist access:

| Method | Description |
|---|---|
| `registerTool(pluginId, tool)` | Register a callable tool with JSON-schema parameters |
| `registerWorkflow(pluginId, workflow)` | Register a multi-step workflow definition |
| `registerHook(pluginId, hook)` | Register an event hook with priority ordering |

IDs must be unique across all plugins. Duplicate IDs throw `PluginExecutionError`.

## Execution

- **executeTool**(toolId, context, params) — invokes the tool handler under sandbox timeout
- **executeWorkflow**(workflowId, context, input) — runs workflow steps sequentially (currently passes data through each step)
- **executeHooks**(event, context, payload) — runs all hooks for an event, sorted by priority (ascending)

All return `ExecutionResult { success, data?, error?, durationMs }`.

## Security Model

- **Plugin allowlist** — `PluginEngineOptions.allowedPlugins` restricts which pluginIds can register/execute. Empty allowlist = all plugins allowed.
- **Access validation** — `validatePluginAccess(pluginId)` checked on every register and execute call.
- **Sandbox API whitelist** — only pre-approved globals accessible inside handlers.
- **Timeout enforcement** — prevents runaway execution.

## Usage

```ts
const engine = new PluginEngine({ allowedPlugins: ['my-plugin'], defaultTimeoutMs: 10000 })

engine.registerTool('my-plugin', {
  id: 'send-email',
  name: 'Send Email',
  description: 'Send an email notification',
  parameters: { to: { type: 'string' }, subject: { type: 'string' } },
  handler: async (ctx, params) => { /* ... */ },
})

const result = await engine.executeTool('send-email', ctx, { to: 'user@example.com', subject: 'Hello' })
```

Error classes: `PluginExecutionError`, `PluginSandboxError`, `PluginTimeoutError`.
