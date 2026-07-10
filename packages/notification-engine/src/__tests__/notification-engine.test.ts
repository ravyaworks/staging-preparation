import { describe, it, expect } from 'vitest';
import { NotificationEngine, createStubChannelProvider } from '../index';

describe('NotificationEngine', () => {
  it('registerChannel and send notification', async () => {
    const engine = new NotificationEngine();
    engine.registerChannel('email', createStubChannelProvider(true));
    const notif = await engine.send({
      tenantId: 't1', channel: 'email', recipient: 'test@example.com',
      title: 'Hello', body: 'Test message', priority: 'normal', maxRetries: 1,
    });
    expect(notif.id).toBeTruthy();
    expect(notif.status).toBe('delivered');
  });

  it('send returns failed for unregistered channel', async () => {
    const engine = new NotificationEngine();
    const notif = await engine.send({
      tenantId: 't1', channel: 'sms', recipient: '+1234',
      body: 'Test', priority: 'normal', maxRetries: 1,
    });
    expect(notif.status).toBe('failed');
    expect(notif.error).toContain('No provider registered');
  });

  it('cancel returns false for delivered notification', async () => {
    const engine = new NotificationEngine();
    engine.registerChannel('email', createStubChannelProvider(true));
    const notif = await engine.send({
      tenantId: 't1', channel: 'email', recipient: 'a@b.com',
      title: 'T', body: 'B', priority: 'normal', maxRetries: 1,
    });
    const cancelled = await engine.cancel(notif.id);
    expect(cancelled).toBe(false);
  });

  it('list filters by tenant and status', async () => {
    const engine = new NotificationEngine();
    engine.registerChannel('email', createStubChannelProvider(true));
    await engine.send({ tenantId: 't1', channel: 'email', recipient: 'a@b.com', body: 'M1', priority: 'normal', maxRetries: 1 });
    await engine.send({ tenantId: 't2', channel: 'email', recipient: 'c@d.com', body: 'M2', priority: 'normal', maxRetries: 1 });
    expect(engine.list('t1')).toHaveLength(1);
  });

  it('template CRUD', () => {
    const engine = new NotificationEngine();
    const tpl = engine.registerTemplate({ tenantId: 't1', name: 'Welcome', channel: 'email', body: 'Hello {{name}}', variables: ['name'] });
    expect(tpl.id).toBeTruthy();
    expect(engine.getTemplate(tpl.id)?.name).toBe('Welcome');
    const updated = engine.updateTemplate(tpl.id, { name: 'Welcome Updated' });
    expect(updated?.name).toBe('Welcome Updated');
    expect(engine.listTemplates('t1')).toHaveLength(1);
  });

  it('sendFromTemplate compiles variables', async () => {
    const engine = new NotificationEngine();
    engine.registerChannel('email', createStubChannelProvider(true));
    const tpl = engine.registerTemplate({ tenantId: 't1', name: 'Welcome', channel: 'email', subject: 'Hi {{name}}', body: 'Hello {{name}}', variables: ['name'] });
    const notif = await engine.sendFromTemplate(tpl.id, 't1', 'user@test.com', { name: 'Alice' });
    expect(notif.body).toBe('Hello Alice');
    expect(notif.title).toBe('Hi Alice');
  });

  it('retries on failure (status becomes queued for async retry)', async () => {
    const engine = new NotificationEngine();
    engine.registerChannel('email', createStubChannelProvider(false));
    const notif = await engine.send({
      tenantId: 't1', channel: 'email', recipient: 'a@b.com',
      body: 'Retry test', priority: 'normal', maxRetries: 1,
    });
    expect(notif.status).toBe('queued');
    expect(notif.retryCount).toBe(1);
  });
});
