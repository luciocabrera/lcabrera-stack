import type {
  AppNotification,
  NotificationPlacement,
} from '#ui/contexts/NotificationContext';

export type NotificationViewportProps = {
  readonly notifications: readonly AppNotification[];
  readonly onDismiss: (notificationId: string) => void;
  readonly placement: NotificationPlacement;
};
