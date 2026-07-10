export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook' | 'in_app';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export interface Notification {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  recipient: string;
  title?: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  templateId?: string;
  templateData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDeliveryResult {
  notificationId: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface NotificationChannelProvider {
  send(notification: Notification): Promise<NotificationDeliveryResult>;
  validate?(recipient: string): boolean;
}

export class NotificationEngine {
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private channelProviders: Map<NotificationChannel, NotificationChannelProvider> = new Map();
  private readonly defaultMaxRetries = 3;

  registerChannel(channel: NotificationChannel, provider: NotificationChannelProvider): void {
    this.channelProviders.set(channel, provider);
  }

  async send(input: Omit<Notification, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const notification: Notification = {
      ...input,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'queued',
      retryCount: 0,
      maxRetries: this.defaultMaxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.set(notification.id, notification);
    await this.deliver(notification);
    return notification;
  }

  async sendFromTemplate(
    templateId: string,
    tenantId: string,
    recipient: string,
    data: Record<string, unknown>,
    channel?: NotificationChannel,
    priority?: NotificationPriority,
  ): Promise<Notification> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    const body = this.compileTemplate(template.body, data);
    const title = template.subject ? this.compileTemplate(template.subject, data) : undefined;

    return this.send({
      tenantId,
      channel: channel ?? template.channel,
      recipient,
      title,
      body,
      priority: priority ?? 'normal',
      templateId,
      templateData: data,
      maxRetries: this.defaultMaxRetries,
    });
  }

  async cancel(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification || notification.status === 'sent' || notification.status === 'delivered') {
      return false;
    }
    notification.status = 'cancelled';
    notification.updatedAt = new Date();
    return true;
  }

  get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  list(tenantId: string, status?: NotificationStatus): Notification[] {
    let results = Array.from(this.notifications.values()).filter(n => n.tenantId === tenantId);
    if (status) results = results.filter(n => n.status === status);
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  registerTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): NotificationTemplate {
    const t: NotificationTemplate = {
      ...template,
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.templates.set(t.id, t);
    return t;
  }

  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(tenantId: string, channel?: NotificationChannel): NotificationTemplate[] {
    let results = Array.from(this.templates.values()).filter(t => t.tenantId === tenantId);
    if (channel) results = results.filter(t => t.channel === channel);
    return results;
  }

  updateTemplate(id: string, input: Partial<Omit<NotificationTemplate, 'id' | 'createdAt'>>): NotificationTemplate | undefined {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.templates.set(id, updated);
    return updated;
  }

  private async deliver(notification: Notification): Promise<void> {
    const provider = this.channelProviders.get(notification.channel);
    if (!provider) {
      notification.status = 'failed';
      notification.error = `No provider registered for channel: ${notification.channel}`;
      notification.updatedAt = new Date();
      return;
    }

    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.updatedAt = new Date();

    try {
      const result = await provider.send(notification);
      if (result.success) {
        notification.status = 'delivered';
        notification.deliveredAt = result.timestamp;
      } else {
        throw new Error(result.error ?? 'Delivery failed');
      }
    } catch (error) {
      notification.retryCount++;
      if (notification.retryCount <= notification.maxRetries) {
        notification.status = 'queued';
        notification.error = `Retry ${notification.retryCount}/${notification.maxRetries}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } else {
        notification.status = 'failed';
        notification.error = error instanceof Error ? error.message : 'Delivery failed';
      }
    }
    notification.updatedAt = new Date();
  }

  private compileTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return String(data[key] ?? `{{${key}}}`);
    });
  }
}

// Stub channel provider for testing
export function createStubChannelProvider(success: boolean = true): NotificationChannelProvider {
  return {
    async send(notification: Notification): Promise<NotificationDeliveryResult> {
      await new Promise(resolve => setTimeout(resolve, 5));
      if (success) {
        return { notificationId: notification.id, success: true, timestamp: new Date() };
      }
      return { notificationId: notification.id, success: false, error: 'Simulated failure', timestamp: new Date() };
    },
    validate(recipient: string): boolean {
      return recipient.length > 0;
    },
  };
}
