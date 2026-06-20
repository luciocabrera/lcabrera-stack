// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNotifications } from '@/hooks/useNotifications.hook';

import { NotificationProvider } from './NotificationContext.provider';

type WrapperProps = {
  readonly children: ReactNode;
};

const TestHarness = () => {
  const { dismissNotification, dismissNotifications, notifications, notify } =
    useNotifications();

  return (
    <div>
      <button
        onClick={() => {
          notify({
            message: 'Saved successfully',
            title: 'Success',
            variant: 'success',
          });
        }}
        type='button'
      >
        Add Auto
      </button>
      <button
        onClick={() => {
          notify({
            durationMs: 0,
            message: 'Persistent warning',
            variant: 'warning',
          });
        }}
        type='button'
      >
        Add Persistent
      </button>
      <button onClick={dismissNotifications} type='button'>
        Dismiss All
      </button>
      <span data-testid='count'>{notifications.length}</span>
      {notifications.map((notification) => (
        <button
          data-testid={`dismiss-${notification.id}`}
          key={notification.id}
          onClick={() => {
            dismissNotification(notification.id);
          }}
          type='button'
        >
          dismiss
        </button>
      ))}
    </div>
  );
};

const Wrapper = ({ children }: WrapperProps) => {
  return <NotificationProvider>{children}</NotificationProvider>;
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('NotificationProvider', () => {
  it('auto-dismisses notifications after the default duration', () => {
    vi.useFakeTimers();

    render(<TestHarness />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'Add Auto' }));

    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      vi.advanceTimersByTime(3001);
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('keeps notifications with durationMs=0 until dismissed', () => {
    vi.useFakeTimers();

    render(<TestHarness />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'Add Persistent' }));

    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByTestId('count').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss All' }));

    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
