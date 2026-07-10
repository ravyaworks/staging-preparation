import { describe, it, expect } from 'vitest';
import { PluginFramework } from '../index';
import type { PluginManifest, PluginLifecycle } from '../index';

describe('PluginFramework', () => {
  const manifest: PluginManifest = { id: 'plugin1', name: 'Test Plugin', version: '1.0.0', description: 'Test' };
  const lifecycle: PluginLifecycle = {};

  it('install and get plugin', async () => {
    const framework = new PluginFramework();
    const meta = await framework.install(manifest, lifecycle);
    expect(meta.manifest.id).toBe('plugin1');
    expect(meta.status).toBe('inactive');
    expect(framework.get('plugin1')?.manifest.name).toBe('Test Plugin');
  });

  it('rejects duplicate install', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await expect(framework.install(manifest, lifecycle)).rejects.toThrow('already installed');
  });

  it('enable changes status to active', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await framework.enable('plugin1');
    expect(framework.get('plugin1')?.status).toBe('active');
    expect(framework.get('plugin1')?.enabled).toBe(true);
  });

  it('disable changes status to inactive', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await framework.enable('plugin1');
    await framework.disable('plugin1');
    expect(framework.get('plugin1')?.status).toBe('inactive');
  });

  it('list returns all plugins', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await framework.install({ ...manifest, id: 'plugin2', name: 'P2', version: '1.0', description: 'D' }, lifecycle);
    expect(framework.list()).toHaveLength(2);
  });

  it('listEnabled returns only enabled plugins', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await framework.install({ ...manifest, id: 'plugin2', name: 'P2', version: '1.0', description: 'D' }, lifecycle);
    await framework.enable('plugin1');
    expect(framework.listEnabled()).toHaveLength(1);
  });

  it('uninstall removes plugin', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    await framework.uninstall('plugin1');
    expect(framework.get('plugin1')).toBeUndefined();
  });

  it('updateConfig changes config', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle, { key: 'old' });
    await framework.updateConfig('plugin1', { key: 'new' });
    expect(framework.get('plugin1')?.config?.key).toBe('new');
  });

  it('setError records error status', async () => {
    const framework = new PluginFramework();
    await framework.install(manifest, lifecycle);
    framework.setError('plugin1', 'Something broke');
    expect(framework.get('plugin1')?.status).toBe('error');
    expect(framework.get('plugin1')?.lastError).toBe('Something broke');
  });

  it('calls lifecycle hooks', async () => {
    const framework = new PluginFramework();
    let loaded = false;
    const lc: PluginLifecycle = { onLoad: async () => { loaded = true; } };
    await framework.install(manifest, lc);
    framework.registerHook('plugin1', async () => { loaded = true; });
    await framework.enable('plugin1');
    expect(loaded).toBe(true);
  });
});
