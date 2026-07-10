import { Router, type Request, type Response } from 'express';
import { ChannelOrchestrator } from '@conversation-platform/channel-service';
import type { ChannelConfig, ChannelAuthConfig, ChannelType } from '@conversation-platform/channel-core';
import { getPrismaClient, ChannelConnectionRepository } from '@conversation-platform/database';
import { webhookLimiter } from '../middleware/rate-limit';

const router: import('express').Router = Router();
const prisma = getPrismaClient();
const connectionRepo = new ChannelConnectionRepository(prisma);
const orchestrator = new ChannelOrchestrator({}, connectionRepo);

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.get('/implementations', (_req: Request, res: Response) => {
  const types = orchestrator.listRegisteredImplementations();
  res.json({ success: true, data: types });
});

router.get('/', async (req: Request, res: Response) => {
  const channels = orchestrator.getConnectedChannels(tenantId(req));
  res.json({ success: true, data: channels });
});

router.get('/:type', async (req: Request, res: Response) => {
  const type = req.params.type as ChannelType;
  const health = await orchestrator.getChannelHealth(tenantId(req), type);
  if (!health) {
    return res.status(404).json({ success: false, error: `Channel ${type} not connected` });
  }
  res.json({ success: true, data: health });
});

router.post('/:type/connect', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    const { config, auth } = req.body as { config: ChannelConfig; auth: ChannelAuthConfig };
    const registration = await orchestrator.connectChannel(tenantId(req), type, config, auth);
    res.status(201).json({ success: true, data: registration });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:type/disconnect', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    await orchestrator.disconnectChannel(tenantId(req), type);
    res.json({ success: true, data: { disconnected: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:type/reconnect', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    await orchestrator.reconnectChannel(tenantId(req), type);
    res.json({ success: true, data: { reconnected: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.patch('/:type/config', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    const { config } = req.body as { config: Partial<ChannelConfig> };
    await orchestrator.updateChannelConfig(tenantId(req), type, config);
    res.json({ success: true, data: { updated: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:type/messages', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    const messageId = await orchestrator.sendMessage(tenantId(req), type, req.body as any);
    res.status(201).json({ success: true, data: { messageId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/:type/typing', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    const { conversationId, isTyping } = req.body as { conversationId: string; isTyping: boolean };
    await orchestrator.sendTypingIndicator(tenantId(req), type, conversationId, isTyping);
    res.json({ success: true, data: { sent: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.all('/:type/webhook', webhookLimiter, async (req: Request, res: Response) => {
  try {
    const type = req.params.type as ChannelType;
    const context = { requestId: req.headers['x-request-id'] as string || '', tenantId: tenantId(req) };
    const messages = await orchestrator.processIncomingPayload(tenantId(req), type, req.body as Record<string, unknown>, context);
    res.json({ success: true, data: { messagesReceived: messages.length } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

export { router as channelsRoutes };
