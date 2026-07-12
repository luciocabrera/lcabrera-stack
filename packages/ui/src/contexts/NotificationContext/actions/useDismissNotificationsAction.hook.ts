import { useNotificationContextValue } from '../useNotificationContextValue.hook';

export const useDismissNotificationsAction = () => {
  const { notificationsStore, timeoutMapRef } = useNotificationContextValue();

  return () => {
    for (const timeoutId of timeoutMapRef.current.values()) {
      clearTimeout(timeoutId);
    }

    timeoutMapRef.current.clear();
    notificationsStore.set({ notifications: [] });
  };
};
