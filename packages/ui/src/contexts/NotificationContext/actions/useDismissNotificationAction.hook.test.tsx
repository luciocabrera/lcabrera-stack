// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotificationProvider } from '../NotificationContext.provider';
import { useGetNotifications } from '../selectors';
import { useDismissNotificationAction } from './useDismissNotificationAction.hook';
import { useNotifyAction } from './useNotifyAction.hook';

type WrapperProps = { readonly children: ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <NotificationProvider>{children}</NotificationProvider>
);

afterEach(() => {
  vi.useRealTimers();
});

describe('useDismissNotificationAction', () => {
  it('removes the target notification from the store', () => {
    const { result } = renderHook(
      () => ({
        dismiss: useDismissNotificationAction(),
        notifications: useGetNotifications(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    let id: string | undefined;

    act(() => {
      id = result.current.notify({
        durationMs: 0,
        message: 'Hello',
        variant: 'info',
      });
    });

    expect(result.current.notifications.length).toBe(1);

    act(() => {
      if (id) result.current.dismiss(id);
    });

    expect(result.current.notifications.length).toBe(0);
  });

  it('cancels the auto-dismiss timer when dismissed early', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { result } = renderHook(
      () => ({
        dismiss: useDismissNotificationAction(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    let id: string | undefined;

    act(() => {
      id = result.current.notify({
        durationMs: 3000,
        message: 'Auto',
        variant: 'info',
      });
    });

    act(() => {
      if (id) result.current.dismiss(id);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
