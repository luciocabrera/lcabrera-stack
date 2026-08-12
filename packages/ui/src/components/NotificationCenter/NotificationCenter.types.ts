import type {
  AppNotification,
  NotificationPlacement,
} from '#ui/contexts/NotificationContext';

export type NotificationsByPlacement = Record<
  NotificationPlacement,
  readonly AppNotification[]
>;
