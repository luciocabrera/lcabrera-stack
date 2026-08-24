import type { AppNotification } from '#ui/contexts/NotificationContext';

export const sortNotificationsByNewest = (
  notifications: readonly AppNotification[],
): readonly AppNotification[] => {
  return notifications.toReversed();
};
