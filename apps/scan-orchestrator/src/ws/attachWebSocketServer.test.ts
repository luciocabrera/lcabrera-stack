import type { AddressInfo } from 'node:net';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

import { attachWebSocketServer } from './attachWebSocketServer.ts';
import { createHttpServer } from './createHttpServer.ts';
import { createRunStatusHub } from './runStatusHub.ts';

const waitForOpen = (socket: WebSocket): Promise<void> =>
  new Promise((resolve) => socket.on('open', () => resolve()));

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
    attachWebSocketServer({ httpServer, hub });

    const runId = crypto.randomUUID();
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);
    client.send(JSON.stringify({ runId, type: 'subscribe' }));
    await wait(50);

    const messagePromise = new Promise<string>((resolve) => {
      client.on('message', (data: Buffer) => resolve(data.toString('utf8')));
    });

    hub.publish(runId, {
      runId,
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
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
    attachWebSocketServer({ httpServer, hub });

    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);
    client.send(
      JSON.stringify({ runId: crypto.randomUUID(), type: 'subscribe' }),
    );
    await wait(50);

    let isReceived = false;
    client.on('message', () => {
      isReceived = true;
    });

    hub.publish(crypto.randomUUID(), {
      runId: crypto.randomUUID(),
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });
    await wait(50);

    expect(isReceived).toBe(false);
    client.close();
  });

  it('ignores a malformed message without closing the connection', async () => {
    const hub = createRunStatusHub();
    attachWebSocketServer({ httpServer, hub });

    const client = new WebSocket(`ws://127.0.0.1:${port}/ws/runs`);
    await waitForOpen(client);

    client.send('not json');
    await wait(50);

    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });
});
