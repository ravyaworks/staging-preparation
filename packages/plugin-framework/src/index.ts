export type PluginStatus = 'active' | 'inactive' | 'error';
export type PluginLoadStrategy = 'eager' | 'lazy';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[];
  permissions?: string[];
  minAppVersion?: string;
  loadStrategy?: PluginLoadStrategy;
}

export interface PluginMetadata {
  manifest: PluginManifest;
  status: PluginStatus;
  enabled: boolean;
  config?: Record<string, unknown>;
  installedAt: Date;
  updatedAt: Date;
  lastError?: string;
}

export interface PluginLifecycle {
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(context: PluginContext): Promise<void>;
  onEnable?(context: PluginContext): Promise<void>;
  onDisable?(context: PluginContext): Promise<void>;
  onInstall?(context: PluginContext): Promise<void>;
  onUninstall?(context: PluginContext): Promise<void>;
  onConfigChange?(config: Record<string, unknown>, context: PluginContext): Promise<void>;
}

export interface PluginContext {
  pluginId: string;
  logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
  config: Record<string, unknown>;
}

export type PluginHook = (context: PluginContext) => Promise<void>;

export class PluginFramework {
  private plugins: Map<string, PluginMetadata> = new Map();
  private lifecycles: Map<string, PluginLifecycle> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();

  async install(manifest: PluginManifest, lifecycle: PluginLifecycle, initialConfig?: Record<string, unknown>): Promise<PluginMetadata> {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin already installed: ${manifest.id}`);
    }

    const metadata: PluginMetadata = {
      manifest,
      status: 'inactive',
      enabled: false,
      config: initialConfig,
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    this.plugins.set(manifest.id, metadata);
    this.lifecycles.set(manifest.id, lifecycle);

    const context = this.createContext(manifest.id, metadata);
    if (lifecycle.onInstall) await lifecycle.onInstall(context);

    return metadata;
  }

  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    const lifecycle = this.lifecycles.get(pluginId);
    if (lifecycle?.onUninstall) {
      await lifecycle.onUninstall(this.createContext(pluginId, plugin));
    }

    this.plugins.delete(pluginId);
    this.lifecycles.delete(pluginId);
  }

  async enable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    const lifecycle = this.lifecycles.get(pluginId);
    plugin.status = 'active';
    plugin.enabled = true;
    plugin.updatedAt = new Date();

    if (lifecycle?.onEnable) {
      await lifecycle.onEnable(this.createContext(pluginId, plugin));
    }

    const hooks = this.hooks.get(pluginId);
    if (hooks && lifecycle?.onLoad) {
      await lifecycle.onLoad(this.createContext(pluginId, plugin));
    }
  }

  async disable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    const lifecycle = this.lifecycles.get(pluginId);
    if (lifecycle?.onDisable) {
      await lifecycle.onDisable(this.createContext(pluginId, plugin));
    }

    const hooks = this.hooks.get(pluginId);
    if (hooks && lifecycle?.onUnload) {
      await lifecycle.onUnload(this.createContext(pluginId, plugin));
    }

    plugin.status = 'inactive';
    plugin.enabled = false;
    plugin.updatedAt = new Date();
  }

  get(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId);
  }

  list(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }

  listEnabled(): PluginMetadata[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  async updateConfig(pluginId: string, config: Record<string, unknown>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    const lifecycle = this.lifecycles.get(pluginId);
    plugin.config = config;
    plugin.updatedAt = new Date();

    if (lifecycle?.onConfigChange) {
      await lifecycle.onConfigChange(config, this.createContext(pluginId, plugin));
    }
  }

  registerHook(pluginId: string, hook: PluginHook): void {
    const existing = this.hooks.get(pluginId) ?? [];
    existing.push(hook);
    this.hooks.set(pluginId, existing);
  }

  getHooks(pluginId: string): PluginHook[] {
    return this.hooks.get(pluginId) ?? [];
  }

  setError(pluginId: string, error: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.status = 'error';
      plugin.lastError = error;
      plugin.updatedAt = new Date();
    }
  }

  private createContext(pluginId: string, metadata: PluginMetadata): PluginContext {
    return {
      pluginId,
      logger: {
        info: (msg: string) => console.log(`[Plugin:${pluginId}] INFO: ${msg}`),
        warn: (msg: string) => console.warn(`[Plugin:${pluginId}] WARN: ${msg}`),
        error: (msg: string) => console.error(`[Plugin:${pluginId}] ERROR: ${msg}`),
      },
      config: metadata.config ?? {},
    };
  }
}
