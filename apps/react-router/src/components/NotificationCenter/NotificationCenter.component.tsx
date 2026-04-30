import * as stylex from '@stylexjs/stylex';
import type { MouseEvent } from 'react';

import { Card } from '@/components/Card';
import { MenuCloseIcon } from '@/components/Icons';
import { useNotifications } from '@/hooks/useNotifications.hook';

import { NOTIFICATION_CENTER_PLACEMENTS } from './NotificationCenter.constants';
import { styles } from './NotificationCenter.stylex';
import {
  getAccentStyle,
  groupNotificationsByPlacement,
  sortNotificationsByNewest,
} from './utils';

export const NotificationCenter = () => {
  const { dismissNotification, notifications } = useNotifications();

  const notificationsByPlacement = groupNotificationsByPlacement(notifications);

  const handleDismissClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const notificationId = event.currentTarget.dataset.notificationId;

    if (!notificationId) {
      return;
    }

    dismissNotification(notificationId);
  };

  if (notifications.length === 0) {
    return;
  }

  return (
    <>
      {NOTIFICATION_CENTER_PLACEMENTS.map((placement) => {
        const placementNotifications = sortNotificationsByNewest(
          notificationsByPlacement[placement],
        );

        if (placementNotifications.length === 0) {
          return;
        }

        const isBottomPlacement = placement.startsWith('bottom');

        return (
          <div
            key={placement}
            {...stylex.props(
              styles.viewport,
              placement === 'top-left' && styles.viewportTopLeft,
              placement === 'top-right' && styles.viewportTopRight,
              placement === 'bottom-left' && styles.viewportBottomLeft,
              placement === 'bottom-right' && styles.viewportBottomRight,
            )}
          >
            <div
              {...stylex.props(
                styles.stack,
                isBottomPlacement ? styles.stackBottom : styles.stackTop,
              )}
            >
              {placementNotifications.map((notification) => (
                <div key={notification.id} {...stylex.props(styles.item)}>
                  <div
                    {...stylex.props(
                      styles.itemSurface,
                      getAccentStyle(notification.variant),
                    )}
                  >
                    <Card color='default' elevation='md' padding='md'>
                      <div {...stylex.props(styles.itemBody)}>
                        <div {...stylex.props(styles.itemContent)}>
                          {notification.title ? (
                            <p {...stylex.props(styles.title)}>
                              {notification.title}
                            </p>
                          ) : undefined}
                          <p {...stylex.props(styles.message)}>
                            {notification.message}
                          </p>
                        </div>
                        <button
                          aria-label='Dismiss notification'
                          data-notification-id={notification.id}
                          onClick={handleDismissClick}
                          type='button'
                          {...stylex.props(styles.dismissButton)}
                        >
                          <MenuCloseIcon size={14} />
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
