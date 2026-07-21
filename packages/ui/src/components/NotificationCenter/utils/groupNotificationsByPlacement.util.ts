import type { AppNotification } from '@lcabrera/ui/contexts/NotificationContext';

import type { NotificationsByPlacement } from '../NotificationCenter.types';

type MutableNotificationsByPlacement = {
  [K in keyof NotificationsByPlacement]: AppNotification[];
};

const createEmptyPlacementMap = (): MutableNotificationsByPlacement => ({
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
    groupedNotifications[notification.placement].push(notification);
  }

  return groupedNotifications;
};
