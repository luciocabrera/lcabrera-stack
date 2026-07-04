import type { AppNotification } from '@repo/ui/contexts/NotificationContext';

import { styles } from '../NotificationCenter.stylex';

/** Resolves the accent rail style for a notification variant. */
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
