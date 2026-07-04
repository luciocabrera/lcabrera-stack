import type {
  AppNotification,
  NotificationPlacement,
} from '@repo/ui/contexts/NotificationContext';

export type NotificationsByPlacement = Record<
  NotificationPlacement,
  readonly AppNotification[]
>;
