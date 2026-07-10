# @conversation-platform/plugin-framework

Plugin architecture with manifest-driven registration, full lifecycle hooks (install, enable, load, disable, uninstall, config change), and a simple hook registration system.

## Responsibilities
- Install/enable/disable/uninstall plugins from `PluginManifest` metadata
- Manage plugin lifecycle via `onLoad`, `onUnload`, `onEnable`, `onDisable`, `onInstall`, `onUninstall`, and `onConfigChange` hooks
- Track plugin status (active, inactive, error) and store per-plugin configuration
- Register and retrieve arbitrary hooks for extensibility within plugin execution
- Provide scoped logger and config context per plugin instance

## Dependencies
- `@conversation-platform/event-bus`, `@conversation-platform/types`
- `@conversation-platform/logger`, `@conversation-platform/config`, `@conversation-platform/shared`

## Public API
`PluginFramework` class with `install`, `uninstall`, `enable`, `disable`, `updateConfig`, `registerHook`, `getHooks`, `setError`, `list`, and `listEnabled`. Exports `PluginManifest`, `PluginMetadata`, `PluginLifecycle`, `PluginContext`, and `PluginHook`.

## Extension Points
Implement `PluginLifecycle` in any plugin module; register custom hooks that other system components can invoke; wire `event-bus` for cross-plugin communication.

## Future
Add plugin dependency resolution with load ordering, sandboxed plugin execution, and a remote plugin registry for dynamic discovery.
