import { useNotifyAction } from '@repo/ui/contexts/NotificationContext/actions';
import { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';

const DEFAULT_WS_URL = 'ws://localhost:4100/ws/runs';
const RECONNECT_DELAY_MS = 2000;

type ScanStatusMessage = {
  readonly scannerId: string;
  readonly status: string;
  readonly type: 'scan-status';
};

type UseRunStatusSocketArgs = {
  readonly runId: string;
};

const isScanStatusMessage = (value: unknown): value is ScanStatusMessage =>
  typeof value === 'object' &&
  value !== null &&
  (value as { type?: unknown }).type === 'scan-status';

/**
 * Subscribes to apps/scan-orchestrator's live run-status WebSocket
 * (TECH_SPEC §2.7) — a legitimate useEffect use case (synchronizing with an
 * external system), not an exception to "no useEffect for server data".
 * The socket is a cache-invalidation signal, not a data channel: on any
 * message it revalidates, and the loader stays the single source of truth
 * for data shape. The WS payload's `scannerId`/`status` are only ever used
 * to *label* a toast notification on a terminal transition — never to
 * drive rendered state directly. Basic reconnect-with-backoff on
 * disconnect; no polling fallback (accepted risk — a socket that can't
 * reconnect needs a manual page refresh).
 */
export const useRunStatusSocket = ({ runId }: UseRunStatusSocketArgs) => {
  const revalidator = useRevalidator();
  const notify = useNotifyAction();
  const revalidateRef = useRef(revalidator.revalidate);
  const notifyRef = useRef(notify);

  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
    notifyRef.current = notify;
  }, [revalidator.revalidate, notify]);

  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_SCAN_ORCHESTRATOR_WS_URL ?? DEFAULT_WS_URL;
    let socket: undefined | WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let isUnmounted = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        socket?.send(JSON.stringify({ runId, type: 'subscribe' }));
      });

      socket.addEventListener('message', (event) => {
        void revalidateRef.current();

        let payload: unknown;
        try {
          payload = JSON.parse(event.data as string);
        } catch {
          return;
        }

        if (!isScanStatusMessage(payload)) return;

        if (payload.status === 'failed') {
          notifyRef.current({
            message: `The ${payload.scannerId} scan failed. Open the scan for details.`,
            title: 'Scan failed',
            variant: 'error',
          });
        } else if (payload.status === 'succeeded') {
          notifyRef.current({
            message: `The ${payload.scannerId} scan finished successfully.`,
            title: 'Scan complete',
            variant: 'success',
          });
        }
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
