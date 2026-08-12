import type { AppNotification } from '#ui/contexts/NotificationContext';

export type NotificationItemProps = {
  readonly notification: AppNotification;
  readonly onDismiss: (notificationId: string) => void;
};
