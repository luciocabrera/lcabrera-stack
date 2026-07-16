import type { AppNotification, NotifyArgs } from '../NotificationContext.types';

import { INITIAL_NOTIFICATION_STATE } from '../NotificationContext.constants';
import { useNotificationContextValue } from '../useNotificationContextValue.hook';
import { createNotificationId } from '../utils';

export const useNotifyAction = () => {
  const { notificationsStore, timeoutMapRef } = useNotificationContextValue();

  return ({
    durationMs,
    message,
    placement,
    title,
    variant = 'info',
  }: NotifyArgs) => {
    const state = notificationsStore.get() ?? INITIAL_NOTIFICATION_STATE;
    const resolvedDurationMs = durationMs ?? state.defaultDurationMs;
    const resolvedPlacement = placement ?? state.defaultPlacement;

    const id = createNotificationId();
    const notification: AppNotification = {
      durationMs: resolvedDurationMs,
      id,
      message,
      placement: resolvedPlacement,
      title,
      variant,
    };

    notificationsStore.set({
      notifications: [...state.notifications, notification],
    });

    if (resolvedDurationMs > 0) {
      const timeoutId = setTimeout(() => {
        const currentState =
          notificationsStore.get() ?? INITIAL_NOTIFICATION_STATE;

        notificationsStore.set({
          notifications: currentState.notifications.filter((n) => n.id !== id),
        });

        timeoutMapRef.current.delete(id);
      }, resolvedDurationMs);

      timeoutMapRef.current.set(id, timeoutId);
    }

    return id;
  };
};
