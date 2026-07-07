export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  payload: T;
  metadata: {
    tenantId?: string;
    userId?: string;
    correlationId?: string;
    timestamp: Date;
    version: number;
  };
}

export interface EventHandler<T = unknown> {
  (event: DomainEvent<T>): Promise<void>;
}

export interface EventBus {
  publish<T>(type: string, payload: T, metadata?: Partial<DomainEvent['metadata']>): Promise<void>;
  subscribe<T>(type: string, handler: EventHandler<T>): () => void;
  publishMany(events: Array<{ type: string; payload: unknown; metadata?: Partial<DomainEvent['metadata']> }>): Promise<void>;
  clear(): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async publish<T>(type: string, payload: T, metadata?: Partial<DomainEvent['metadata']>): Promise<void> {
    const event: DomainEvent<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      metadata: {
        tenantId: metadata?.tenantId,
        userId: metadata?.userId,
        correlationId: metadata?.correlationId,
        timestamp: metadata?.timestamp ?? new Date(),
        version: metadata?.version ?? 1,
      },
    };

    const handlers = this.handlers.get(type);
    if (!handlers) return;

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          promises.push(result.catch((error) => {
            console.error(`Event handler error for ${type}:`, error);
          }));
        }
      } catch (error) {
        console.error(`Event handler error for ${type}:`, error);
      }
    }

    await Promise.all(promises);
  }

  async publishMany(events: Array<{ type: string; payload: unknown; metadata?: Partial<DomainEvent['metadata']> }>): Promise<void> {
    await Promise.all(events.map((e) => this.publish(e.type, e.payload, e.metadata)));
  }

  subscribe<T>(type: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
    };
  }

  clear(): void {
    this.handlers.clear();
  }
}
