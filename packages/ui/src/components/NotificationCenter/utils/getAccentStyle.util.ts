import type { AppNotification } from '#ui/contexts/NotificationContext';

import { styles } from '../NotificationItem/NotificationItem.stylex';

export const getAccentStyle = (variant: AppNotification['variant']) => {
  if (variant === 'error') {
    return styles.itemSurfaceError;
  }

  if (variant === 'info') {
    return styles.itemSurfaceInfo;
  }

  if (variant === 'primary') {
    return styles.itemSurfacePrimary;
  }

  if (variant === 'secondary') {
    return styles.itemSurfaceSecondary;
  }

  if (variant === 'success') {
    return styles.itemSurfaceSuccess;
  }

  if (variant === 'warning') {
    return styles.itemSurfaceWarning;
  }

  return styles.itemSurfaceDefault;
};
