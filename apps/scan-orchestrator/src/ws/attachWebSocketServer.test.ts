import type { AddressInfo } from 'node:net';

import { signAccessTicket } from '@lcabrera/server/tickets/sign-access-ticket.util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { attachWebSocketServer } from './attachWebSocketServer.ts';
import { createHttpServer } from './createHttpServer.ts';
import { createRunStatusHub } from './runStatusHub.ts';

const TICKET_SECRET = 'test-ticket-secret';
const TICKET_TTL_MS = 60_000;

type TicketForArgs = {
  readonly runId: string;
  readonly secret?: string;
};

const ticketFor = ({ runId, secret = TICKET_SECRET }: TicketForArgs) =>
  signAccessTicket({
    expiresAt: Date.now() + TICKET_TTL_MS,
    secret,
    subject: runId,
  });

const waitForOpen = (socket: WebSocket): Promise<void> =>
  new Promise((resolve) => socket.on('open', () => resolve()));

const waitForClose = (socket: WebSocket): Promise<number> =>
  new Promise((resolve) => socket.on('close', (code: number) => resolve(code)));

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe('attachWebSocketServer', () => {
  let httpServer: ReturnType<typeof createHttpServer>;
  let port: number;

  beforeEach(async () => {
    httpServer = createHttpServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(0, '127.0.0.1', resolve);
    });
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('delivers a real published message to a client subscribed to that run', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const runId = crypto.randomUUID();
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);
    client.send(
      JSON.stringify({
        runId,
        ticket: ticketFor({ runId }),
        type: 'subscribe',
      }),
    );
    await wait(50);

    const messagePromise = new Promise<string>((resolve) => {
      client.on('message', (data: Buffer) => resolve(data.toString('utf8')));
    });

    hub.publish({
      payload: {
        runId,
        scanId: 'scan-1',
        scannerId: 'linter',
        status: 'running',
        type: 'scan-status',
      },
      runId,
    });

    const message = await messagePromise;
    expect(JSON.parse(message)).toEqual({
      runId,
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });

    client.close();
  });

  it('does not deliver a message to a client subscribed to a different run', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const subscribedRunId = crypto.randomUUID();
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);
    client.send(
      JSON.stringify({
        runId: subscribedRunId,
        ticket: ticketFor({ runId: subscribedRunId }),
        type: 'subscribe',
      }),
    );
    await wait(50);

    let isReceived = false;
    client.on('message', () => {
      isReceived = true;
    });

    hub.publish({
      payload: {
        runId: crypto.randomUUID(),
        scanId: 'scan-1',
        scannerId: 'linter',
        status: 'running',
        type: 'scan-status',
      },
      runId: crypto.randomUUID(),
    });
    await wait(50);

    expect(isReceived).toBe(false);
    client.close();
  });

  it('ignores a malformed message without closing the connection', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    client.send('not json');
    await wait(50);

    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it('closes with 1008 when the ticket is missing', async () => {
    // The regression this guards is the endpoint's original behaviour:
    // knowing a run's uuid was, on its own, enough to subscribe. Asserting
    // the close code — not just that no message arrives — is deliberate: a
    // "no message" assertion also passes when the message is rejected as
    // malformed, so it would stay green even with authorization removed.
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    const closed = waitForClose(client);
    client.send(
      JSON.stringify({ runId: crypto.randomUUID(), type: 'subscribe' }),
    );

    expect(await closed).toBe(1008);
  });

  it('closes with 1008 when the ticket was signed with a different secret', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const runId = crypto.randomUUID();
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    const closed = waitForClose(client);
    client.send(
      JSON.stringify({
        runId,
        ticket: ticketFor({ runId, secret: 'a-different-secret' }),
        type: 'subscribe',
      }),
    );

    expect(await closed).toBe(1008);
  });

  it('closes with 1008 when the ticket is for another run', async () => {
    // A ticket is a capability for one run, not a pass to the endpoint: a
    // user legitimately watching their own run must not be able to reuse
    // that ticket to watch someone else's.
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    const otherRunTicket = ticketFor({ runId: crypto.randomUUID() });
    const closed = waitForClose(client);
    client.send(
      JSON.stringify({
        runId: crypto.randomUUID(),
        ticket: otherRunTicket,
        type: 'subscribe',
      }),
    );

    expect(await closed).toBe(1008);
  });

  it('closes with 1008 when the ticket has expired', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub, ticketSecret: TICKET_SECRET });

    const runId = crypto.randomUUID();
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    const expiredTicket = signAccessTicket({
      expiresAt: Date.now() - 1,
      secret: TICKET_SECRET,
      subject: runId,
    });
    const closed = waitForClose(client);
    client.send(
      JSON.stringify({ runId, ticket: expiredTicket, type: 'subscribe' }),
    );

    expect(await closed).toBe(1008);
  });
});
