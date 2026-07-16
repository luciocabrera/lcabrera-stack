import { useSyncExternalStore } from 'react';

import type { NotificationState } from './NotificationContext.types';

import { INITIAL_NOTIFICATION_STATE } from './NotificationContext.constants';
import { useNotificationContextValue } from './useNotificationContextValue.hook';

export const useNotificationStore = <TSelected>(
  selector: (state: NotificationState) => TSelected,
) => {
  const { notificationsStore } = useNotificationContextValue();

  const getSnapshot = () =>
    notificationsStore.get() ?? INITIAL_NOTIFICATION_STATE;
  const getServerSnapshot = () =>
    notificationsStore.getServerSnapshot() ?? INITIAL_NOTIFICATION_STATE;

  return useSyncExternalStore(
    notificationsStore.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
};
