import type { AppNotification } from '@repo/ui/contexts/NotificationContext';

/** Resolves Card color variant to use for each notification variant. */
export const getNotificationCardColor = (
  variant: AppNotification['variant'],
) => {
  if (variant === 'error') {
    return 'error';
  }

  return 'default';
};
