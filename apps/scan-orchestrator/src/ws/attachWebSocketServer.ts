import type { Server } from 'node:http';
import type { RawData } from 'ws';

import { isAccessTicketValid } from '@lcabrera/server/tickets/is-access-ticket-valid.util';
import { WebSocketServer } from 'ws';
import { z } from 'zod';

import type { RunStatusHub } from './runStatusHub.ts';

// 1008 Policy Violation — the closest standard code to "you may not
// subscribe to this run". Sent instead of silently ignoring the message so
// the client can tell an auth failure apart from a dropped connection and
// stop reconnecting into a loop it cannot win.
const CLOSE_POLICY_VIOLATION = 1008;

// `ticket` is optional *to the parser* on purpose: a subscribe message that
// omits it is an authorization failure, not a malformed one, and the two get
// different treatment below. Requiring it here would collapse "you are not
// allowed" into the silent malformed branch, which is the least useful thing
// to tell a client that is about to retry forever.
const subscribeMessageSchema = z.object({
  runId: z.string().uuid(),
  ticket: z.string().optional(),
  type: z.literal('subscribe'),
});

type AttachWebSocketServerArgs = {
  readonly httpServer: Server;
  readonly hub: RunStatusHub;
  readonly ticketSecret: string;
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
 * `{ type: 'subscribe', runId, ticket }` after connecting.
 *
 * The ticket is the authorization (ADR-041, closing the "uuid, no further
 * auth" gap this endpoint shipped with). It is an HMAC minted by
 * apps/admin_system's run-detail loader — which has already put the request
 * through the session gate and the run's own RBAC read — and it is signed
 * over the run id, so it grants exactly that one run's stream and nothing
 * else. Verification is a local re-derivation: no database, no round trip,
 * nothing to keep in sync but the shared secret.
 *
 * Two failure modes, deliberately different:
 *
 * - **Malformed** (unparseable JSON, not a subscribe message, bad run id) —
 *   ignored, connection stays open. That was the pre-existing contract and a
 *   client sending noise is not necessarily hostile.
 * - **Unauthorized** (missing, bad, expired, or wrong-run ticket) — the
 *   connection is closed with 1008. There is no recovery on this socket, and
 *   leaving it open invites a subscribe-guess loop for free.
 *
 * Note what this does *not* do: the orchestrator learns nothing about *who*
 * is connected. It does not need to — a ticket is proof that some
 * authenticated user was authorized for this run, which is the whole
 * question a read-only status stream has to answer.
 */
export const attachWebSocketServer = ({
  httpServer,
  hub,
  ticketSecret,
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
      if (!result.success) {
        return;
      }

      const isAuthorized = isAccessTicketValid({
        now: Date.now(),
        secret: ticketSecret,
        subject: result.data.runId,
        ticket: result.data.ticket ?? '',
      });

      if (!isAuthorized) {
        socket.close(CLOSE_POLICY_VIOLATION, 'Unauthorized');
        return;
      }

      hub.subscribe({ runId: result.data.runId, socket });
    });
  });

  return wss;
};
