import { useEffect, useRef } from 'react';

import { useStore } from '@/hooks';

import type {
  NotificationProviderProps,
  NotificationState,
} from './NotificationContext.types';

import {
  DEFAULT_DURATION_MS,
  DEFAULT_PLACEMENT,
} from './NotificationContext.constants';
import { NotificationContext } from './NotificationContext.context';

export const NotificationProvider = ({
  children,
  defaultDurationMs = DEFAULT_DURATION_MS,
  defaultPlacement = DEFAULT_PLACEMENT,
}: NotificationProviderProps) => {
  const initialState: NotificationState = {
    defaultDurationMs,
    defaultPlacement,
    notifications: [],
  };

  const notificationsStore = useStore(initialState);
  const timeoutMapRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  // Keep store defaults in sync if provider props change after mount
  useEffect(() => {
    notificationsStore.set({ defaultDurationMs, defaultPlacement });
    // notificationsStore wraps stable useRef internals — omitted intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultDurationMs, defaultPlacement]);

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    return () => {
      for (const timeoutId of timeoutMap.values()) {
        clearTimeout(timeoutId);
      }

      timeoutMap.clear();
    };
  }, []);

  return (
    <NotificationContext value={{ notificationsStore, timeoutMapRef }}>
      {children}
    </NotificationContext>
  );
};
