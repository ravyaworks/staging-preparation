import type { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Logger } from '@conversation-platform/logger';

interface WebSocketClient {
  ws: WebSocket;
  tenantId: string;
  userId?: string;
  channels: Set<string>;
}

const clients = new Map<string, WebSocketClient>();

let wss: WebSocketServer | null = null;

export function createWebSocketServer(server: import('http').Server, logger?: Logger): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const tenantId = url.searchParams.get('tenantId') || 'default';
    const userId = url.searchParams.get('userId') || undefined;
    const channelsParam = url.searchParams.get('channels');
    const channels = new Set(channelsParam ? channelsParam.split(',') : ['*']);

    const clientId = `${tenantId}:${userId || 'anonymous'}:${Date.now()}`;
    const client: WebSocketClient = { ws, tenantId, userId, channels };
    clients.set(clientId, client);

    logger?.info?.('WebSocket client connected', { clientId, tenantId, userId, channels: [...channels] });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        logger?.debug?.('WebSocket message received', { clientId, type: message.type });

        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (message.type === 'subscribe') {
          if (message.channels) {
            for (const ch of message.channels) {
              client.channels.add(ch);
            }
          }
        } else if (message.type === 'unsubscribe') {
          if (message.channels) {
            for (const ch of message.channels) {
              client.channels.delete(ch);
            }
          }
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      logger?.info?.('WebSocket client disconnected', { clientId });
    });

    ws.on('error', (err) => {
      logger?.error?.('WebSocket client error', { clientId, error: err.message });
      clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: 'connected', payload: { clientId, tenantId, userId } }));
  });

  logger?.info?.('WebSocket server initialized', { path: '/ws' });
  return wss;
}

export function broadcastToTenant(tenantId: string, event: string, payload: unknown): number {
  let sent = 0;
  for (const client of clients.values()) {
    if (client.tenantId === tenantId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: event, payload }));
      sent++;
    }
  }
  return sent;
}

export function broadcastToAll(event: string, payload: unknown): number {
  let sent = 0;
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: event, payload }));
      sent++;
    }
  }
  return sent;
}

export function getConnectedClients(): number {
  return clients.size;
}

export function shutdown(): void {
  if (wss) {
    for (const client of clients.values()) {
      client.ws.close();
    }
    clients.clear();
    wss.close();
    wss = null;
  }
}
