import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  AppNotification,
  NotificationPlacement,
  NotificationProviderProps,
  NotifyArgs,
} from './NotificationContext.types';

import { NotificationContext } from './NotificationContext.context';

const DEFAULT_DURATION_MS = 3000;
const DEFAULT_PLACEMENT: NotificationPlacement = 'bottom-right';

const createNotificationId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

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

  const clearNotificationTimeout = useCallback((id: string) => {
    const timeoutId = timeoutMapRef.current.get(id);

    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    timeoutMapRef.current.delete(id);
  }, []);

  const dismissNotification = useCallback(
    (id: string) => {
      clearNotificationTimeout(id);
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== id),
      );
    },
    [clearNotificationTimeout],
  );

  const dismissNotifications = useCallback(() => {
    for (const timeoutId of timeoutMapRef.current.values()) {
      clearTimeout(timeoutId);
    }

    timeoutMapRef.current.clear();
    setNotifications([]);
  }, []);

  const notify = useCallback(
    ({
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
    },
    [defaultDurationMs, defaultPlacement, dismissNotification],
  );

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutMapRef.current.values()) {
        clearTimeout(timeoutId);
      }

      timeoutMapRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      dismissNotification,
      dismissNotifications,
      notifications,
      notify,
    }),
    [dismissNotification, dismissNotifications, notifications, notify],
  );

  return <NotificationContext value={value}>{children}</NotificationContext>;
};
