import type { NotificationPlacement } from '@/contexts/NotificationContext';

/** Ordered placements used to render NotificationCenter viewports. */
export const NOTIFICATION_CENTER_PLACEMENTS: readonly NotificationPlacement[] =
  ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
