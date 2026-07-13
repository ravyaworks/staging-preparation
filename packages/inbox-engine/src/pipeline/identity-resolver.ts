import type { Logger } from '@conversation-platform/logger';
import { getPrismaClient } from '@conversation-platform/database';
import { ContactRepository } from '@conversation-platform/database';
import type { NormalizedMessage, IdentityResult } from '../types';

export function createIdentityResolver(logger: Logger) {
  function getRepo(): ContactRepository {
    const prisma = getPrismaClient();
    return new ContactRepository(prisma);
  }

  async function resolve(
    tenantId: string,
    message: NormalizedMessage,
  ): Promise<IdentityResult> {
    const repo = getRepo();
    const sender = message.sender;
    const phone = sender.phone;
    const email = sender.email;

    let contact = phone
      ? await repo.findByPhone(tenantId, phone)
      : null;

    if (!contact && email) {
      contact = await repo.findByEmail(tenantId, email);
    }

    if (contact) {
      const tags = contact.tags as string[];
      const channels = (contact.channels as Array<Record<string, unknown>>) ?? [];
      const existingChannels = channels.some(
        (c: Record<string, unknown>) => c.type === message.channel,
      );
      if (!existingChannels) {
        channels.push({ type: message.channel, id: sender.id, addedAt: new Date().toISOString() });
      }
      const updatedTags = tags.includes('returning') ? tags : [...tags, 'returning'];

      await repo.update(contact.id, {
        lastActivityAt: new Date(),
        channels: JSON.stringify(channels),
        tags: updatedTags,
        name: sender.name || contact.name,
        avatarUrl: sender.avatarUrl || contact.avatarUrl,
      } as any);

      return {
        contactId: contact.id,
        isNew: false,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          avatarUrl: contact.avatarUrl,
          tags: updatedTags,
          metadata: (contact.metadata as Record<string, unknown>) ?? {},
        },
      };
    }

    const newContact = await repo.create({
      tenant: { connect: { id: tenantId } },
      name: sender.name ?? sender.phone ?? 'Unknown',
      phone: phone,
      email: email,
      avatarUrl: sender.avatarUrl,
      channels: JSON.stringify([{ type: message.channel, id: sender.id, addedAt: new Date().toISOString() }]),
      tags: ['new', message.channel],
      conversationCount: 0,
      lastActivityAt: new Date(),
    } as any);

    return {
      contactId: newContact.id,
      isNew: true,
      contact: {
        id: newContact.id,
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email,
        avatarUrl: newContact.avatarUrl,
        tags: newContact.tags as string[],
        metadata: (newContact.metadata as Record<string, unknown>) ?? {},
      },
    };
  }

  return { resolve };
}

export type IdentityResolver = ReturnType<typeof createIdentityResolver>;
