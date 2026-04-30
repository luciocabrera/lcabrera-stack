import type { AppNotification } from '@/contexts/NotificationContext';

import type { NotificationsByPlacement } from '../NotificationCenter.types';

const createEmptyPlacementMap = (): NotificationsByPlacement => ({
  'bottom-left': [],
  'bottom-right': [],
  'top-left': [],
  'top-right': [],
});

/** Groups notifications by viewport placement without mutating the source list. */
export const groupNotificationsByPlacement = (
  notifications: readonly AppNotification[],
): NotificationsByPlacement => {
  const groupedNotifications = createEmptyPlacementMap();

  for (const notification of notifications) {
    groupedNotifications[notification.placement] = [
      ...groupedNotifications[notification.placement],
      notification,
    ];
  }

  return groupedNotifications;
};
