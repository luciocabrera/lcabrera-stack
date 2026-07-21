import type { AppNotification } from '@lcabrera/ui/contexts/NotificationContext';

export type NotificationItemProps = {
  readonly notification: AppNotification;
  readonly onDismiss: (notificationId: string) => void;
};
