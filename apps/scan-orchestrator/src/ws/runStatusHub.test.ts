import { describe, expect, it, vi } from 'vitest';

import { createRunStatusHub } from './runStatusHub.ts';

const OPEN = 1;
const CLOSED = 3;

const createFakeSocket = (readyState: number) => {
  const listeners = new Map<string, () => void>();
  return {
    on: vi.fn((event: string, handler: () => void) => {
      listeners.set(event, handler);
    }),
    OPEN,
    readyState,
    send: vi.fn(),
    triggerClose: () => listeners.get('close')?.(),
  };
};

describe('createRunStatusHub', () => {
  it('sends a message to every socket subscribed to a run', () => {
    const hub = createRunStatusHub();
    const socketA = createFakeSocket(OPEN);
    const socketB = createFakeSocket(OPEN);

    hub.subscribe('run-1', socketA as never);
    hub.subscribe('run-1', socketB as never);

    hub.publish('run-1', {
      runId: 'run-1',
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });

    expect(socketA.send).toHaveBeenCalledTimes(1);
    expect(socketB.send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(socketA.send.mock.calls[0]?.[0] as string)).toEqual({
      runId: 'run-1',
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });
  });

  it('does not send to sockets subscribed to a different run', () => {
    const hub = createRunStatusHub();
    const socket = createFakeSocket(OPEN);

    hub.subscribe('run-1', socket as never);
    hub.publish('run-2', {
      runId: 'run-2',
      scanId: 'scan-2',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('does not send to a closed socket', () => {
    const hub = createRunStatusHub();
    const socket = createFakeSocket(CLOSED);

    hub.subscribe('run-1', socket as never);
    hub.publish('run-1', {
      runId: 'run-1',
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('stops publishing to a socket once it closes', () => {
    const hub = createRunStatusHub();
    const socket = createFakeSocket(OPEN);

    hub.subscribe('run-1', socket as never);
    socket.triggerClose();

    hub.publish('run-1', {
      runId: 'run-1',
      scanId: 'scan-1',
      scannerId: 'linter',
      status: 'running',
      type: 'scan-status',
    });

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('is a no-op when publishing to a run with no subscribers', () => {
    const hub = createRunStatusHub();
    expect(() =>
      hub.publish('no-subscribers', {
        runId: 'no-subscribers',
        scanId: 'scan-1',
        scannerId: 'linter',
        status: 'running',
        type: 'scan-status',
      }),
    ).not.toThrow();
  });
});
