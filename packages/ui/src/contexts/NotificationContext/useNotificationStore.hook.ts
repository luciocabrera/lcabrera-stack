import { useStoreSelector } from '@repo/ui/hooks/useStoreSelector.hook';

import type { NotificationState } from './NotificationContext.types';

import { useNotificationContextValue } from './useNotificationContextValue.hook';

export const useNotificationStore = <TSelected>(
  selector: (state: NotificationState) => TSelected,
) => {
  const { notificationsStore } = useNotificationContextValue();

  return useStoreSelector({
    selector,
    store: notificationsStore,
  });
};
