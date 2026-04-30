import * as stylex from '@stylexjs/stylex';
import type { MouseEvent } from 'react';
import { useMemo } from 'react';

import { Card } from '@/components/Card';
import { MenuCloseIcon } from '@/components/Icons';
import {
  type AppNotification,
  type NotificationPlacement,
} from '@/contexts/NotificationContext';
import { useNotifications } from '@/hooks/useNotifications.hook';

import type { NotificationsByPlacement } from './NotificationCenter.types';

import { styles } from './NotificationCenter.stylex';

const placements: readonly NotificationPlacement[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const createEmptyPlacementMap = (): NotificationsByPlacement => ({
  'bottom-left': [],
  'bottom-right': [],
  'top-left': [],
  'top-right': [],
});

const sortNotificationsByNewest = (
  notifications: readonly AppNotification[],
): readonly AppNotification[] => {
  return [...notifications].reverse();
};

export const NotificationCenter = () => {
  const { dismissNotification, notifications } = useNotifications();

  const notificationsByPlacement = useMemo(() => {
    const groupedNotifications = createEmptyPlacementMap();

    for (const notification of notifications) {
      groupedNotifications[notification.placement] = [
        ...groupedNotifications[notification.placement],
        notification,
      ];
    }

    return groupedNotifications;
  }, [notifications]);

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
      {placements.map((placement) => {
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
                  <div {...stylex.props(styles.itemSurface)}>
                    <Card
                      color={notification.variant}
                      elevation='md'
                      padding='md'
                    >
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
