import type { AppNotification } from '@repo/ui/contexts/NotificationContext';

export type NotificationItemProps = {
  readonly notification: AppNotification;
  readonly onDismiss: (notificationId: string) => void;
};
