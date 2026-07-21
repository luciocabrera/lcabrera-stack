import type { AppNotification } from '@lcabrera/ui/contexts/NotificationContext';

/** Returns notifications in reverse insertion order without mutating the input array. */
export const sortNotificationsByNewest = (
  notifications: readonly AppNotification[],
): readonly AppNotification[] => {
  return notifications.toReversed();
};
