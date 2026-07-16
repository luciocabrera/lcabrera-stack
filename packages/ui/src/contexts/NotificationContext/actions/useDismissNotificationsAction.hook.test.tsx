// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotificationProvider } from '../NotificationContext.provider';
import { useGetNotifications } from '../selectors';
import { useDismissNotificationsAction } from './useDismissNotificationsAction.hook';
import { useNotifyAction } from './useNotifyAction.hook';

type WrapperProps = { readonly children: ReactNode };
const Wrapper = ({ children }: WrapperProps) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useDismissNotificationsAction', () => {
  it('removes all notifications from the store', () => {
    const { result } = renderHook(
      () => ({
        dismissAll: useDismissNotificationsAction(),
        notifications: useGetNotifications(),
        notify: useNotifyAction(),
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.notify({
        durationMs: 0,
        message: 'First',
        variant: 'info',
      });
      result.current.notify({
        durationMs: 0,
        message: 'Second',
        variant: 'warning',
      });
    });

    expect(result.current.notifications.length).toBe(2);

    act(() => {
      result.current.dismissAll();
    });

    expect(result.current.notifications.length).toBe(0);
  });
});
