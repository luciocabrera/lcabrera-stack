import type {
  AppNotification,
  NotificationPlacement,
} from '@lcabrera/ui/contexts/NotificationContext';

export type NotificationsByPlacement = Record<
  NotificationPlacement,
  readonly AppNotification[]
>;
