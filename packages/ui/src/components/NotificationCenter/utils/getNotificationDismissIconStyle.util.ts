import type { AppNotification } from '#ui/contexts/NotificationContext';

import { styles } from '../NotificationItem/NotificationItem.stylex';

export const getNotificationDismissIconStyle = (
  variant: AppNotification['variant'],
) => {
  if (variant === 'error') {
    return styles.dismissButtonError;
  }

  if (variant === 'info') {
    return styles.dismissButtonInfo;
  }

  if (variant === 'primary') {
    return styles.dismissButtonPrimary;
  }

  if (variant === 'secondary') {
    return styles.dismissButtonSecondary;
  }

  if (variant === 'success') {
    return styles.dismissButtonSuccess;
  }

  return variant === 'warning'
    ? styles.dismissButtonWarning
    : styles.dismissButtonDefault;
};
