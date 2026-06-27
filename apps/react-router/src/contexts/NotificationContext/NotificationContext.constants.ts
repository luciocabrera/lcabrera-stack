import type {
  NotificationPlacement,
  NotificationState,
} from './NotificationContext.types';

export const DEFAULT_DURATION_MS = 3000;
export const DEFAULT_PLACEMENT: NotificationPlacement = 'bottom-right';

export const INITIAL_NOTIFICATION_STATE: NotificationState = {
  defaultDurationMs: DEFAULT_DURATION_MS,
  defaultPlacement: DEFAULT_PLACEMENT,
  notifications: [],
};
