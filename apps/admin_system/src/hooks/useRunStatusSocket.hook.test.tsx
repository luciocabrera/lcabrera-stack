// @vitest-environment jsdom

import { NotificationProvider } from '@lcabrera/ui/contexts/NotificationContext';
import { useGetNotifications } from '@lcabrera/ui/contexts/NotificationContext/selectors';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRunStatusSocket } from './useRunStatusSocket.hook';

type DispatchArgs = {
  readonly data: string;
  readonly event: string;
};

type Listener = (event: { data: string }) => void;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  readonly sent: string[] = [];
  readonly url: string;
  // perfectionist/sort-classes (alphabetical by visibility-then-name) and
  // unicorn/consistent-class-member-order (private-before-public) disagree
  // on where this field belongs relative to `sent`/`url` — no field order
  // satisfies both simultaneously.
  // eslint-disable-next-line unicorn/consistent-class-member-order
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  // Two positional params, matching the real WebSocket.addEventListener
  // signature exactly — this class stands in for the global WebSocket the
  // hook under test constructs, so it must accept calls the same way.
  // eslint-disable-next-line local-rules/destructuring-for-functions -- mirrors EventTarget's addEventListener(type, listener), fixed by the API this fake stands in for
  addEventListener(event: string, handler: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(handler);
  }

  close(): void {
    this.dispatch({ data: '', event: 'close' });
  }

  dispatch({ data, event }: DispatchArgs): void {
    const handlers = this.listeners.get(event) ?? [];
    for (const handler of handlers) {
      handler({ data });
    }
  }

  send(data: string): void {
    this.sent.push(data);
  }
}

const NotificationList = () => {
  const notifications = useGetNotifications();
  return (
    <ul>
      {notifications.map((notification) => (
        <li key={notification.id}>
          {notification.variant}: {notification.title} — {notification.message}
        </li>
      ))}
    </ul>
  );
};

const TestHarness = ({ runId }: { readonly runId: string }) => {
  useRunStatusSocket({ runId });
  return <NotificationList />;
};

const renderHarness = (runId: string) => {
  const Stub = createRoutesStub([
    {
      Component: () => (
        <NotificationProvider>
          <TestHarness runId={runId} />
        </NotificationProvider>
      ),
      path: '/',
    },
  ]);

  return render(<Stub initialEntries={['/']} />);
};

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useRunStatusSocket', () => {
  it('subscribes with the given runId once the socket opens', () => {
    renderHarness('run-1');
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket?.dispatch({ data: '', event: 'open' });
    });

    expect(socket?.sent).toEqual([
      JSON.stringify({ runId: 'run-1', type: 'subscribe' }),
    ]);
  });

  it('shows an error notification when a scan-status message reports failed', () => {
    renderHarness('run-1');
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket?.dispatch({
        data: JSON.stringify({
          runId: 'run-1',
          scanId: 'scan-1',
          scannerId: 'fallow',
          status: 'failed',
          type: 'scan-status',
        }),
        event: 'message',
      });
    });

    expect(screen.getByText(/error: Scan failed/)).not.toBeNull();
    expect(screen.getByText(/fallow scan failed/)).not.toBeNull();
  });

  it('shows a success notification when a scan-status message reports succeeded', () => {
    renderHarness('run-1');
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket?.dispatch({
        data: JSON.stringify({
          runId: 'run-1',
          scanId: 'scan-1',
          scannerId: 'linter',
          status: 'succeeded',
          type: 'scan-status',
        }),
        event: 'message',
      });
    });

    expect(screen.getByText(/success: Scan complete/)).not.toBeNull();
  });

  it('does not notify on a scan-progress message', () => {
    renderHarness('run-1');
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket?.dispatch({
        data: JSON.stringify({
          runId: 'run-1',
          scanId: 'scan-1',
          scannerId: 'fallow',
          status: 'assistant',
          type: 'scan-progress',
        }),
        event: 'message',
      });
    });

    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('ignores a malformed message without throwing', () => {
    renderHarness('run-1');
    const socket = FakeWebSocket.instances[0];

    expect(() => {
      act(() => {
        socket?.dispatch({ data: 'not json', event: 'message' });
      });
    }).not.toThrow();
  });
});
