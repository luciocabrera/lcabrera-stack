import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { NotificationViewportProps } from './NotificationViewport.types';

import { styles } from '../NotificationCenter.stylex';
import { NotificationItem } from '../NotificationItem';

export const NotificationViewport = ({
  notifications,
  onDismiss,
  placement,
}: NotificationViewportProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const isBottomPlacement = placement.startsWith('bottom');

  useEffect(() => {
    const viewport = viewportRef.current;

    viewport?.showPopover?.();

    return () => {
      if (viewport?.matches(':popover-open')) viewport.hidePopover();
    };
  }, []);

  return (
    <div
      aria-atomic='false'
      aria-live='polite'
      popover='manual'
      ref={viewportRef}
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
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};
