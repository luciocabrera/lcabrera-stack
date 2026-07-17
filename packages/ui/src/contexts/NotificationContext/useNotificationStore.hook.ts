import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { NotificationState } from './NotificationContext.types';

import { INITIAL_NOTIFICATION_STATE } from './NotificationContext.constants';
import { useNotificationContextValue } from './useNotificationContextValue.hook';

export const useNotificationStore = <TSelected>(
  selector: (state: NotificationState) => TSelected,
) => {
  const { notificationsStore } = useNotificationContextValue();

  return useStoreSelector({
    fallback: INITIAL_NOTIFICATION_STATE,
    selector,
    store: notificationsStore,
  });
};
