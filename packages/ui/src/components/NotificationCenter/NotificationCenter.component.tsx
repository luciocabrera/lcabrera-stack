import type { NotificationPlacement } from '@repo/ui/contexts/NotificationContext';

import { useDismissNotificationAction } from '@repo/ui/contexts/NotificationContext/actions';
import { useGetNotifications } from '@repo/ui/contexts/NotificationContext/selectors';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { NOTIFICATION_CENTER_PLACEMENTS } from './NotificationCenter.constants';
import { styles } from './NotificationCenter.stylex';
import { NotificationItem } from './NotificationItem';
import {
  groupNotificationsByPlacement,
  sortNotificationsByNewest,
} from './utils';

export const NotificationCenter = () => {
  const dismissNotification = useDismissNotificationAction();
  const notifications = useGetNotifications();
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

  // Resolve and drop the empty placements up front rather than returning nothing
  // from the render callback below: a `map` that conditionally returns no value
  // is what Biome's useIterableCallbackReturn flags, and every way of writing
  // that "nothing" (`return;` / `null` / `undefined`) trips one linter or
  // another here. Filtering first means the callback always returns an element.
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
      {populatedPlacements.map(({ placement, placementNotifications }) => {
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
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
