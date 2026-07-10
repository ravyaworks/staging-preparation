export type AuditAction = 'create' | 'update' | 'delete' | 'read' | 'execute' | 'enable' | 'disable' | 'publish' | 'archive' | 'import' | 'export' | 'configure';

export type AuditResourceType = 'knowledge' | 'workflow' | 'tool' | 'plugin' | 'user' | 'system' | 'config' | 'tenant' | 'notification' | 'analytics';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  tenantId: string;
  userId?: string;
  changes?: AuditChange[];
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface AuditQuery {
  actions?: AuditAction[];
  resourceTypes?: AuditResourceType[];
  resourceId?: string;
  tenantId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditSystem {
  private entries: AuditEntry[] = [];

  record(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    this.entries.push(auditEntry);
    return auditEntry;
  }

  recordChange(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    tenantId: string,
    changes: AuditChange[],
    userId?: string,
    metadata?: Record<string, unknown>,
  ): AuditEntry {
    return this.record({ action, resourceType, resourceId, tenantId, userId, changes, metadata });
  }

  recordSimple(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    tenantId: string,
    userId?: string,
  ): AuditEntry {
    return this.record({ action, resourceType, resourceId, tenantId, userId });
  }

  query(query: AuditQuery): AuditEntry[] {
    let results = [...this.entries];

    if (query.actions && query.actions.length > 0) {
      results = results.filter(e => query.actions!.includes(e.action));
    }
    if (query.resourceTypes && query.resourceTypes.length > 0) {
      results = results.filter(e => query.resourceTypes!.includes(e.resourceType));
    }
    if (query.resourceId) {
      results = results.filter(e => e.resourceId === query.resourceId);
    }
    if (query.tenantId) {
      results = results.filter(e => e.tenantId === query.tenantId);
    }
    if (query.userId) {
      results = results.filter(e => e.userId === query.userId);
    }
    if (query.startDate) {
      results = results.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      results = results.filter(e => e.timestamp <= query.endDate!);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;
    return results.slice(offset, offset + limit);
  }

  getByResource(resourceType: AuditResourceType, resourceId: string): AuditEntry[] {
    return this.entries.filter(e => e.resourceType === resourceType && e.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getByTenant(tenantId: string, limit: number = 50): AuditEntry[] {
    return this.entries.filter(e => e.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getByUser(userId: string, limit: number = 50): AuditEntry[] {
    return this.entries.filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getStats(tenantId: string): Record<AuditResourceType, number> {
    const stats: Record<string, number> = {};
    const types: AuditResourceType[] = ['knowledge', 'workflow', 'tool', 'plugin', 'user', 'system', 'config', 'tenant', 'notification', 'analytics'];
    for (const type of types) {
      stats[type] = this.entries.filter(e => e.tenantId === tenantId && e.resourceType === type).length;
    }
    return stats as Record<AuditResourceType, number>;
  }
}
