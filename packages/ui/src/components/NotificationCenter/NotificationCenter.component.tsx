import { useDismissNotificationAction } from '#ui/contexts/NotificationContext/actions';
import { useGetNotifications } from '#ui/contexts/NotificationContext/selectors';

import { NOTIFICATION_CENTER_PLACEMENTS } from './NotificationCenter.constants';
import { NotificationViewport } from './NotificationViewport';
import {
  groupNotificationsByPlacement,
  sortNotificationsByNewest,
} from './utils';

export const NotificationCenter = () => {
  const dismissNotification = useDismissNotificationAction();
  const notifications = useGetNotifications();

  if (notifications.length === 0) return;

  const notificationsByPlacement = groupNotificationsByPlacement(notifications);
  const populatedPlacements = NOTIFICATION_CENTER_PLACEMENTS.map(
    (placement) => ({
      placement,
      placementNotifications: sortNotificationsByNewest(
        notificationsByPlacement[placement],
      ),
    }),
  ).filter(({ placementNotifications }) => placementNotifications.length > 0);

  return (
    <>
      {populatedPlacements.map(({ placement, placementNotifications }) => (
        <NotificationViewport
          key={placement}
          notifications={placementNotifications}
          onDismiss={dismissNotification}
          placement={placement}
        />
      ))}
    </>
  );
};
