// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider } from '../NotificationContext.provider';
import { useGetNotifications } from '../selectors';
import { useNotifyAction } from './useNotifyAction.hook';

type WrapperProps = { readonly children: ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <NotificationProvider>{children}</NotificationProvider>
);

afterEach(() => {
  vi.useRealTimers();
});

describe('useNotifyAction', () => {
  it('adds a notification to the store and returns its id', () => {
    const { result } = renderHook(
      () => ({
        notifications: useGetNotifications(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    let returnedId: string | undefined;

    act(() => {
      returnedId = result.current.notify({ message: 'Hello', variant: 'info' });
    });

    expect(typeof returnedId).toBe('string');
    expect(result.current.notifications.length).toBe(1);
    expect(result.current.notifications[0]?.message).toBe('Hello');
  });

  it('auto-dismisses after durationMs elapses', () => {
    vi.useFakeTimers();

    const { result } = renderHook(
      () => ({
        notifications: useGetNotifications(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.notify({
        durationMs: 1000,
        message: 'Temp',
        variant: 'info',
      });
    });

    expect(result.current.notifications.length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1001);
    });

    expect(result.current.notifications.length).toBe(0);
  });

  it('does not auto-dismiss when durationMs is 0', () => {
    vi.useFakeTimers();

    const { result } = renderHook(
      () => ({
        notifications: useGetNotifications(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.notify({
        durationMs: 0,
        message: 'Sticky',
        variant: 'warning',
      });
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.notifications.length).toBe(1);
  });
});
