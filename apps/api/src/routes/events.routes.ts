import { Router, type Request, type Response } from 'express';
import type { Logger } from '@conversation-platform/logger';

const router: Router = Router();
let loggerInstance: Logger | undefined;

export function setLogger(logger: Logger): void {
  loggerInstance = logger;
}

interface SSEClient {
  res: Response;
  tenantId: string;
  channels: Set<string>;
}

const sseClients = new Map<string, SSEClient>();

router.get('/stream', (req: Request, res: Response) => {
  const tenantId = (req.query.tenantId as string) || 'default';
  const channels = new Set((req.query.channels as string)?.split(',') || ['*']);
  const clientId = `${tenantId}:${Date.now()}`;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', payload: { clientId, tenantId } })}\n\n`);

  const client: SSEClient = { res, tenantId, channels };
  sseClients.set(clientId, client);

  loggerInstance?.info?.('SSE client connected', { clientId, tenantId });

  const keepAlive = setInterval(() => {
    res.write(`:keepalive\n\n`);
  }, 30000);

  req.on('close', () => {
    sseClients.delete(clientId);
    clearInterval(keepAlive);
    loggerInstance?.info?.('SSE client disconnected', { clientId });
  });
});

export function sendSSEEvent(tenantId: string, event: string, payload: unknown): number {
  let sent = 0;
  for (const client of sseClients.values()) {
    if (client.tenantId === tenantId && (client.channels.has('*') || client.channels.has(event))) {
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
      sent++;
    }
  }
  return sent;
}

export function broadcastSSE(event: string, payload: unknown): number {
  let sent = 0;
  for (const client of sseClients.values()) {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    sent++;
  }
  return sent;
}

export function getSSEClientCount(): number {
  return sseClients.size;
}

export { router as eventsRoutes };
