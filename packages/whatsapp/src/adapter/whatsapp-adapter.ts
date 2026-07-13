import type { Logger } from '@conversation-platform/logger';
import type { IncomingChannelAdapter, ChannelInfo, NormalizedMessage } from '@conversation-platform/inbox-engine';
import { createNormalizedMessage, createAttachment } from '@conversation-platform/inbox-engine';
import type { WhatsAppWebhookPayload } from '../types';

export function createWhatsAppAdapter(logger: Logger): IncomingChannelAdapter {
  const channelInfo: ChannelInfo = {
    channelType: 'whatsapp',
    channelId: 'whatsapp-business',
    channelName: 'WhatsApp Business Platform',
    isActive: true,
  };

  function validate(payload: Record<string, unknown>): boolean {
    if (!payload || typeof payload !== 'object') return false;
    const p = payload as Record<string, unknown>;
    const hasEntry = Array.isArray(p.entry) && p.entry.length > 0;
    if (!hasEntry) return false;
    const entry = (p.entry as Array<Record<string, unknown>>)[0]!;
    const hasChanges = Array.isArray(entry.changes) && entry.changes.length > 0;
    if (!hasChanges) return false;
    const change = (entry.changes as Array<Record<string, unknown>>)[0]!;
    const value = change.value as Record<string, unknown> | undefined;
    if (!value) return false;
    const messages = value.messages as Array<Record<string, unknown>> | undefined;
    return Array.isArray(messages) && messages.length > 0;
  }

  function normalize(payload: Record<string, unknown>): NormalizedMessage {
    const p = payload as WhatsAppWebhookPayload;
    const entry = p.entry![0]!;
    const change = entry.changes[0]!;
    const value = change.value!;
    const msg = value.messages![0]!;
    const metadata = value.metadata!;

    const senderContact = value.contacts?.find((c: { wa_id: string }) => c.wa_id === msg.from);
    const senderName = senderContact?.profile?.name;
    const recipientPhone = metadata.phone_number_id;
    const messageType = msg.type ?? 'text';
    const timestamp = msg.timestamp
      ? new Date(parseInt(msg.timestamp) * 1000)
      : new Date();

    let content = '';
    const attachments: ReturnType<typeof createAttachment>[] = [];

    switch (messageType) {
      case 'text':
        content = msg.text?.body ?? '';
        break;
      case 'image':
        content = msg.image?.caption ?? '';
        attachments.push(createAttachment({
          type: 'image',
          url: msg.image?.id ? `wa-media://${msg.image.id}` : undefined,
          mimeType: msg.image?.mime_type,
          filename: `image-${msg.id}`,
        }));
        break;
      case 'document':
        content = msg.document?.caption ?? '';
        attachments.push(createAttachment({
          type: 'document',
          url: msg.document?.id ? `wa-media://${msg.document.id}` : undefined,
          mimeType: msg.document?.mime_type,
          filename: msg.document?.filename,
        }));
        break;
      case 'video':
        content = msg.video?.caption ?? '';
        attachments.push(createAttachment({
          type: 'video',
          url: msg.video?.id ? `wa-media://${msg.video.id}` : undefined,
          mimeType: msg.video?.mime_type,
        }));
        break;
      case 'audio':
        content = msg.audio?.caption ?? '';
        attachments.push(createAttachment({
          type: 'audio',
          url: msg.audio?.id ? `wa-media://${msg.audio.id}` : undefined,
          mimeType: msg.audio?.mime_type,
        }));
        break;
      case 'location':
        content = msg.location
          ? `Location: ${msg.location.latitude}, ${msg.location.longitude}`
          : '';
        attachments.push(createAttachment({
          type: 'location',
          metadata: msg.location as Record<string, unknown> | undefined,
        }));
        break;
      case 'contacts':
        content = 'Contact shared';
        break;
      case 'sticker':
        content = 'Sticker';
        attachments.push(createAttachment({
          type: 'sticker',
          url: msg.sticker?.id ? `wa-media://${msg.sticker.id}` : undefined,
          mimeType: msg.sticker?.mime_type,
        }));
        break;
      default:
        content = msg[messageType as keyof typeof msg]?.body ?? '';
    }

    return createNormalizedMessage({
      channel: 'whatsapp',
      channelMessageId: msg.id,
      direction: 'inbound',
      messageType: messageType as NormalizedMessage['messageType'],
      content,
      attachments,
      sender: {
        id: msg.from,
        phone: msg.from,
        name: senderName,
      },
      recipient: {
        id: metadata.phone_number_id,
        phone: metadata.phone_number_id,
      },
      metadata: {
        waMessageId: msg.id,
        waTimestamp: msg.timestamp,
        waProfileName: senderName,
        context: msg.context
          ? { forwarded: msg.context.forwarded, frequently_forwarded: msg.context.frequently_forwarded, from: msg.context.from, id: msg.context.id }
          : undefined,
      },
      timestamp,
      raw: payload,
    });
  }

  return { channelInfo, validate, normalize };
}
