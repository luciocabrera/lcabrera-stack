import type { MouseEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { NotificationPlacement } from '@/contexts/NotificationContext';

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
  const openPlacementsRef = useRef(new Set<NotificationPlacement>());
  const viewportRefs = useRef(new Map<NotificationPlacement, HTMLDivElement>());

  const notificationsByPlacement = groupNotificationsByPlacement(notifications);

  useEffect(() => {
    for (const placement of NOTIFICATION_CENTER_PLACEMENTS) {
      const viewport = viewportRefs.current.get(placement);

      if (!viewport || openPlacementsRef.current.has(placement)) {
        continue;
      }

      viewport.showPopover?.();
      openPlacementsRef.current.add(placement);
    }
  }, [notifications]);

  if (notifications.length === 0) return;

  const handleDismissClick = (event: MouseEvent<HTMLButtonElement>): void => {
    const notificationId = event.currentTarget.dataset.notificationId;

    if (notificationId) {
      dismissNotification(notificationId);
    }
  };

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
            aria-atomic='false'
            aria-live='polite'
            key={placement}
            popover='manual'
            ref={(element) => {
              if (element) {
                viewportRefs.current.set(placement, element);
                return;
              }

              openPlacementsRef.current.delete(placement);
              viewportRefs.current.delete(placement);
            }}
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
