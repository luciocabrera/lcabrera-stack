import type { AppNotification } from '#ui/contexts/NotificationContext';

import { styles } from '../NotificationItem/NotificationItem.stylex';

/** Resolves dismiss button icon style for each notification variant. */
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

  if (variant === 'warning') {
    return styles.dismissButtonWarning;
  }

  return styles.dismissButtonDefault;
};
