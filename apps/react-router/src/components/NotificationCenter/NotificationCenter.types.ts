import type {
  AppNotification,
  NotificationPlacement,
} from '@/contexts/NotificationContext';

export type NotificationsByPlacement = Record<
  NotificationPlacement,
  readonly AppNotification[]
>;
