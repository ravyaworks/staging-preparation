import { Router, type Request, type Response } from 'express';
import { ChannelOrchestrator } from '@conversation-platform/channel-service';
import type { ChannelType } from '@conversation-platform/channel-core';
import { getPrismaClient, ChannelConnectionRepository } from '@conversation-platform/database';

const router: import('express').Router = Router();
const prisma = getPrismaClient();
const connectionRepo = new ChannelConnectionRepository(prisma);
const orchestrator = new ChannelOrchestrator({}, connectionRepo);

function tenantId(req: Request): string {
  return (req as any).tenantId || 'default';
}

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { channelType, message } = req.body as { channelType: ChannelType; message: any };
    const messageId = await orchestrator.sendMessage(tenantId(req), channelType, message);
    res.status(201).json({ success: true, data: { messageId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    const { message, channelTypes } = req.body as { message: any; channelTypes: ChannelType[] };
    const results: Array<{ channelType: ChannelType; messageId: string; success: boolean; error?: string }> = [];

    for (const channelType of channelTypes) {
      try {
        const messageId = await orchestrator.sendMessage(tenantId(req), channelType, message);
        results.push({ channelType, messageId, success: true });
      } catch (error: unknown) {
        results.push({
          channelType,
          messageId: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

router.post('/incoming', async (req: Request, res: Response) => {
  try {
    const { channelType, payload } = req.body as { channelType: ChannelType; payload: Record<string, unknown> };
    const context = { requestId: req.headers['x-request-id'] as string || '', tenantId: tenantId(req) };
    const messages = await orchestrator.processIncomingPayload(tenantId(req), channelType, payload, context);
    res.status(201).json({ success: true, data: { messagesReceived: messages.length, messages } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

export { router as messagesRoutes };
