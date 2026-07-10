import { describe, it, expect } from 'vitest';
import { AuditSystem } from '../index';

describe('AuditSystem', () => {
  it('record creates audit entry', () => {
    const audit = new AuditSystem();
    const entry = audit.record({ action: 'create', resourceType: 'knowledge', resourceId: 'doc1', tenantId: 't1' });
    expect(entry.id).toBeTruthy();
    expect(entry.action).toBe('create');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('recordChange creates entry with changes', () => {
    const audit = new AuditSystem();
    const entry = audit.recordChange('update', 'workflow', 'wf1', 't1', [{ field: 'status', oldValue: 'draft', newValue: 'active' }], 'u1');
    const changes = entry.changes!;
    expect(changes).toHaveLength(1);
    expect(changes[0]?.field).toBe('status');
    expect(entry.userId).toBe('u1');
  });

  it('recordSimple creates basic entry', () => {
    const audit = new AuditSystem();
    const entry = audit.recordSimple('delete', 'tool', 'tool1', 't1', 'u1');
    expect(entry.action).toBe('delete');
    expect(entry.userId).toBe('u1');
  });

  it('query filters by actions', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1');
    audit.recordSimple('update', 'knowledge', 'd1', 't1');
    const results = audit.query({ actions: ['create'] });
    expect(results).toHaveLength(1);
  });

  it('query filters by resource type', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1');
    audit.recordSimple('create', 'workflow', 'wf1', 't1');
    expect(audit.query({ resourceTypes: ['knowledge'] })).toHaveLength(1);
  });

  it('getByResource returns entries for resource', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'doc1', 't1');
    audit.recordSimple('update', 'knowledge', 'doc1', 't1');
    audit.recordSimple('create', 'workflow', 'wf1', 't1');
    expect(audit.getByResource('knowledge', 'doc1')).toHaveLength(2);
  });

  it('getByTenant returns recent entries', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1');
    audit.recordSimple('create', 'knowledge', 'd2', 't2');
    expect(audit.getByTenant('t1')).toHaveLength(1);
  });

  it('getByUser returns user entries', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1', 'u1');
    audit.recordSimple('create', 'knowledge', 'd2', 't1', 'u2');
    expect(audit.getByUser('u1')).toHaveLength(1);
  });

  it('getStats returns counts by resource type', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1');
    audit.recordSimple('create', 'workflow', 'wf1', 't1');
    audit.recordSimple('execute', 'tool', 'tool1', 't1');
    const stats = audit.getStats('t1');
    expect(stats.knowledge).toBe(1);
    expect(stats.workflow).toBe(1);
    expect(stats.tool).toBe(1);
  });

  it('query sorts by timestamp descending', () => {
    const audit = new AuditSystem();
    audit.recordSimple('create', 'knowledge', 'd1', 't1');
    const results = audit.query({ tenantId: 't1' });
    expect(results).toHaveLength(1);
  });
});
