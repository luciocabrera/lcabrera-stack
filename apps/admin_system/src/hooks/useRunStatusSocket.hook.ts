import { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';

const DEFAULT_WS_URL = 'ws://localhost:4100/ws/runs';
const RECONNECT_DELAY_MS = 2000;

type UseRunStatusSocketArgs = {
  readonly runId: string;
};

/**
 * Subscribes to apps/scan-orchestrator's live run-status WebSocket
 * (TECH_SPEC §2.7) — a legitimate useEffect use case (synchronizing with an
 * external system), not an exception to "no useEffect for server data".
 * The socket is a cache-invalidation signal, not a data channel: on any
 * message it just calls revalidate(), the loader stays the single source
 * of truth for data shape. Basic reconnect-with-backoff on disconnect; no
 * polling fallback (accepted risk — a socket that can't reconnect needs a
 * manual page refresh).
 */
export const useRunStatusSocket = ({ runId }: UseRunStatusSocketArgs): void => {
  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator.revalidate);

  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
  }, [revalidator.revalidate]);

  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_SCAN_ORCHESTRATOR_WS_URL ?? DEFAULT_WS_URL;
    let socket: undefined | WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let isUnmounted = false;

    const connect = (): void => {
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        socket?.send(JSON.stringify({ runId, type: 'subscribe' }));
      });

      socket.addEventListener('message', () => {
        void revalidateRef.current();
      });

      socket.addEventListener('close', () => {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      });
    };

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, [runId]);
};
