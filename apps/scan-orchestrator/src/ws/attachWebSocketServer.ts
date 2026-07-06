import type { Server } from 'node:http';

import { type RawData, WebSocketServer } from 'ws';
import { z } from 'zod';

import type { RunStatusHub } from './runStatusHub.ts';

const subscribeMessageSchema = z.object({
  runId: z.string().uuid(),
  type: z.literal('subscribe'),
});

type AttachWebSocketServerArgs = {
  readonly httpServer: Server;
  readonly hub: RunStatusHub;
};

const decodeRawData = (data: RawData): string => {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8');
  }
  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }
  return Buffer.from(data).toString('utf8');
};

/**
 * Attaches a ws WebSocketServer to the given http.Server at /ws/runs
 * (TECH_SPEC §2.7). A client subscribes to one run's updates by sending
 * `{ type: 'subscribe', runId }` after connecting — validated as a real
 * uuid, no further auth (internal tool). Malformed messages are ignored,
 * not fatal to the connection.
 */
export const attachWebSocketServer = ({
  httpServer,
  hub,
}: AttachWebSocketServerArgs): WebSocketServer => {
  const wss = new WebSocketServer({ path: '/ws/runs', server: httpServer });

  wss.on('connection', (socket) => {
    socket.on('message', (data) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(decodeRawData(data));
      } catch {
        return;
      }

      const result = subscribeMessageSchema.safeParse(parsed);
      if (result.success) {
        hub.subscribe({ runId: result.data.runId, socket });
      }
    });
  });

  return wss;
};
