import { useEffect, useRef } from 'react';

import { useStore } from '#ui/hooks';

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
