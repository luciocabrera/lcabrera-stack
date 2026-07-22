import { useNotifyAction } from '@lcabrera/ui/contexts/NotificationContext/actions';
import { useEffect, useRef } from 'react';
import { useRevalidator } from 'react-router';

const DEFAULT_WS_URL = 'ws://localhost:4100/ws/runs';
const RECONNECT_DELAY_MS = 2000;

// 1008 Policy Violation — the orchestrator's answer to a subscription it
// will not authorize. Reconnecting cannot fix it: the same ticket would be
// presented again, so the loop would run until the tab closes.
const CLOSE_POLICY_VIOLATION = 1008;

type ScanStatusMessage = {
  readonly scannerId: string;
  readonly status: string;
  readonly type: 'scan-status';
};

type UseRunStatusSocketArgs = {
  readonly runId: string;
  readonly ticket: string;
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
 *
 * `ticket` is the short-lived capability the loader minted for this run
 * (ADR-041); the orchestrator rejects a subscribe without a valid one. It is
 * held in a ref rather than read from the closure so a reconnect uses the
 * newest one: every message revalidates, which re-runs the loader and issues
 * a fresh ticket, and a socket that reconnected with the stale value would
 * eventually be refused for no reason the user could act on. The socket
 * effect keys on `runId` alone for the same reason — re-running it on each
 * new ticket would tear down and rebuild a perfectly healthy connection on
 * every revalidation.
 */
export const useRunStatusSocket = ({
  runId,
  ticket,
}: UseRunStatusSocketArgs) => {
  const revalidator = useRevalidator();
  const notify = useNotifyAction();
  const revalidateRef = useRef(revalidator.revalidate);
  const notifyRef = useRef(notify);
  const ticketRef = useRef(ticket);

  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
    notifyRef.current = notify;
    ticketRef.current = ticket;
  }, [revalidator.revalidate, notify, ticket]);

  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_SCAN_ORCHESTRATOR_WS_URL ?? DEFAULT_WS_URL;
    let socket: undefined | WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let isUnmounted = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        socket?.send(
          JSON.stringify({
            runId,
            ticket: ticketRef.current,
            type: 'subscribe',
          }),
        );
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

      socket.addEventListener('close', (event) => {
        // A refused subscription is the one close worth giving up on: the
        // reconnect would present the same rejected ticket, so retrying
        // just hammers the orchestrator until the tab closes. Live updates
        // stop; the page still works, and a reload mints a new ticket.
        if (!isUnmounted && event.code !== CLOSE_POLICY_VIOLATION) {
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
