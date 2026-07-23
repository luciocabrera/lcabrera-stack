// @vitest-environment jsdom

import { NotificationProvider } from '@lcabrera/ui/contexts/NotificationContext';
import { useGetNotifications } from '@lcabrera/ui/contexts/NotificationContext/selectors';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { createRoutesStub } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { useRunStatusSocket } from './useRunStatusSocket.hook';

type DispatchArgs = {
  readonly code?: number;
  readonly data: string;
  readonly event: string;
};

type Listener = (event: { code?: number; data: string }) => void;

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

  dispatch({ code, data, event }: DispatchArgs): void {
    const handlers = this.listeners.get(event) ?? [];
    for (const handler of handlers) {
      handler({ code, data });
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

type TestHarnessProps = {
  readonly runId: string;
  readonly ticket: string;
};

const TestHarness = ({ runId, ticket }: TestHarnessProps) => {
  useRunStatusSocket({ runId, ticket });
  return <NotificationList />;
};

type RenderHarnessArgs = {
  readonly runId: string;
  readonly ticket?: string;
};

const renderHarness = ({ runId, ticket = 'ticket-1' }: RenderHarnessArgs) => {
  const Stub = createRoutesStub([
    {
      Component: () => (
        <NotificationProvider>
          <TestHarness runId={runId} ticket={ticket} />
        </NotificationProvider>
      ),
      path: '/',
    },
  ]);

  return render(<Stub initialEntries={['/']} />);
};

type TicketControlRef = {
  current?: (ticket: string) => void;
};

/**
 * Stands in for the loader handing down a fresh ticket on revalidation.
 * The setter is published through an effect rather than assigned during
 * render, so the harness itself stays a well-behaved component.
 */
const ReissuingHarness = ({
  controlRef,
}: {
  readonly controlRef: TicketControlRef;
}) => {
  const [ticket, setTicket] = useState('ticket-1');

  useEffect(() => {
    controlRef.current = setTicket;
  }, [controlRef]);

  return <TestHarness runId='run-1' ticket={ticket} />;
};

const renderReissuingHarness = () => {
  const controlRef: TicketControlRef = {};
  const Stub = createRoutesStub([
    {
      Component: () => (
        <NotificationProvider>
          <ReissuingHarness controlRef={controlRef} />
        </NotificationProvider>
      ),
      path: '/',
    },
  ]);

  render(<Stub initialEntries={['/']} />);
  return controlRef;
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
  it('subscribes with the given runId and ticket once the socket opens', () => {
    renderHarness({ runId: 'run-1' });
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket?.dispatch({ data: '', event: 'open' });
    });

    expect(socket?.sent).toEqual([
      JSON.stringify({ runId: 'run-1', ticket: 'ticket-1', type: 'subscribe' }),
    ]);
  });

  it('does not reconnect after the orchestrator refuses the subscription', () => {
    // Retrying a 1008 presents the same rejected ticket, so a reconnect
    // loop would run until the tab closes without ever succeeding.
    vi.useFakeTimers();
    try {
      renderHarness({ runId: 'run-1' });

      act(() => {
        FakeWebSocket.instances[0]?.dispatch({
          code: 1008,
          data: '',
          event: 'close',
        });
      });
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(FakeWebSocket.instances).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reconnects after an ordinary close', () => {
    // The counterpart to the test above: without this, "does not reconnect"
    // would still pass if reconnection were broken outright.
    vi.useFakeTimers();
    try {
      renderHarness({ runId: 'run-1' });

      act(() => {
        FakeWebSocket.instances[0]?.dispatch({
          code: 1006,
          data: '',
          event: 'close',
        });
      });
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(FakeWebSocket.instances).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reconnects with the newest ticket, not the one it first mounted with', () => {
    // Every status message revalidates, which re-runs the loader and issues
    // a fresh ticket. A reconnect that replayed the mount-time ticket would
    // be refused once the original expired.
    vi.useFakeTimers();
    try {
      const controlRef = renderReissuingHarness();

      act(() => {
        controlRef.current?.('ticket-2');
      });

      act(() => {
        FakeWebSocket.instances[0]?.dispatch({
          code: 1006,
          data: '',
          event: 'close',
        });
      });
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      const reconnected = FakeWebSocket.instances[1];
      act(() => {
        reconnected?.dispatch({ data: '', event: 'open' });
      });

      expect(reconnected?.sent).toEqual([
        JSON.stringify({
          runId: 'run-1',
          ticket: 'ticket-2',
          type: 'subscribe',
        }),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows an error notification when a scan-status message reports failed', () => {
    renderHarness({ runId: 'run-1' });
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
    renderHarness({ runId: 'run-1' });
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
    renderHarness({ runId: 'run-1' });
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
    renderHarness({ runId: 'run-1' });
    const socket = FakeWebSocket.instances[0];

    expect(() => {
      act(() => {
        socket?.dispatch({ data: 'not json', event: 'message' });
      });
    }).not.toThrow();
  });
});
