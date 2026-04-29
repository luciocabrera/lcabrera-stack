import type { NotificationContextValue } from '@/contexts/NotificationContext';

import { useNotificationContextValue } from '@/contexts/NotificationContext';

export const useNotifications = (): NotificationContextValue => {
  return useNotificationContextValue();
};
