import type { WebSocket } from 'ws';

export type RunStatusPayload = {
  readonly runId: string;
  readonly scanId: string;
  readonly scannerId: string;
  readonly status: string;
  readonly type: 'scan-progress' | 'scan-status';
};

/**
 * In-memory Map<runId, Set<WebSocket>> (TECH_SPEC §2.7) — lives in this
 * process because execution and the hub now share one process (the whole
 * point of the two-process redesign, ADR-015): publishing is a plain
 * function call, not a cross-process bridge. Not in packages/scan-ingestion,
 * which stays framework-agnostic with no WebSocket concept.
 */
type PublishArgs = {
  readonly payload: RunStatusPayload;
  readonly runId: string;
};

type SubscribeArgs = {
  readonly runId: string;
  readonly socket: WebSocket;
};

export const createRunStatusHub = () => {
  const subscribers = new Map<string, Set<WebSocket>>();

  const subscribe = ({ runId, socket }: SubscribeArgs): void => {
    let sockets = subscribers.get(runId);
    if (!sockets) {
      sockets = new Set();
      subscribers.set(runId, sockets);
    }
    sockets.add(socket);

    socket.on('close', () => {
      sockets?.delete(socket);
      if (sockets?.size === 0) {
        subscribers.delete(runId);
      }
    });
  };

  const publish = ({ payload, runId }: PublishArgs): void => {
    const sockets = subscribers.get(runId);
    if (!sockets) return;

    const message = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    }
  };

  return { publish, subscribe };
};

export type RunStatusHub = ReturnType<typeof createRunStatusHub>;
