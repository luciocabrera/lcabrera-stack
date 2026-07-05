import * as stylex from '@stylexjs/stylex';

import { MenuCloseIcon } from '@repo/ui/components/Icons';

import type { NotificationItemProps } from './NotificationItem.types';

import { getAccentStyle, getNotificationDismissIconStyle } from '../utils';
import { styles } from './NotificationItem.stylex';

export const NotificationItem = ({
  notification,
  onDismiss,
}: NotificationItemProps) => {
  const handleDismissClick = (): void => {
    onDismiss(notification.id);
  };

  return (
    <div {...stylex.props(styles.item)}>
      <div
        {...stylex.props(
          styles.itemSurface,
          styles.itemSurfaceHover,
          getAccentStyle(notification.variant),
        )}
      >
        <div {...stylex.props(styles.itemBody)}>
          <div {...stylex.props(styles.itemContent)}>
            {notification.title ? (
              <p {...stylex.props(styles.title)}>{notification.title}</p>
            ) : undefined}
            <p {...stylex.props(styles.message)}>{notification.message}</p>
          </div>
          <button
            aria-label='Dismiss notification'
            onClick={handleDismissClick}
            type='button'
            {...stylex.props(
              styles.dismissButton,
              getNotificationDismissIconStyle(notification.variant),
            )}
          >
            <MenuCloseIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
