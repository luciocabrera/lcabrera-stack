import { useEffect, useRef, useState } from 'react';

import type {
  AppNotification,
  NotificationProviderProps,
  NotifyArgs,
} from './NotificationContext.types';

import {
  DEFAULT_DURATION_MS,
  DEFAULT_PLACEMENT,
} from './NotificationContext.constants';
import { NotificationContext } from './NotificationContext.context';
import { createNotificationId } from './utils';

export const NotificationProvider = ({
  children,
  defaultDurationMs = DEFAULT_DURATION_MS,
  defaultPlacement = DEFAULT_PLACEMENT,
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<
    readonly AppNotification[]
  >([]);
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const clearNotificationTimeout = (id: string) => {
    const timeoutId = timeoutMapRef.current.get(id);

    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    timeoutMapRef.current.delete(id);
  };

  const dismissNotification = (id: string) => {
    clearNotificationTimeout(id);
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== id),
    );
  };

  const dismissNotifications = () => {
    for (const timeoutId of timeoutMapRef.current.values()) {
      clearTimeout(timeoutId);
    }

    timeoutMapRef.current.clear();
    setNotifications([]);
  };

  const notify = ({
    durationMs = defaultDurationMs,
    message,
    placement = defaultPlacement,
    title,
    variant = 'info',
  }: NotifyArgs): string => {
    const id = createNotificationId();
    const notification: AppNotification = {
      durationMs,
      id,
      message,
      placement,
      title,
      variant,
    };

    setNotifications((currentNotifications) => [
      ...currentNotifications,
      notification,
    ]);

    if (durationMs > 0) {
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, durationMs);

      timeoutMapRef.current.set(id, timeoutId);
    }

    return id;
  };

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutMapRef.current.values()) {
        clearTimeout(timeoutId);
      }

      timeoutMapRef.current.clear();
    };
  }, []);

  const value = {
    dismissNotification,
    dismissNotifications,
    notifications,
    notify,
  };

  return <NotificationContext value={value}>{children}</NotificationContext>;
};
