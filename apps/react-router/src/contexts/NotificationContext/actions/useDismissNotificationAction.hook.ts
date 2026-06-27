import { INITIAL_NOTIFICATION_STATE } from '../NotificationContext.constants';
import { useNotificationContextValue } from '../useNotificationContextValue.hook';

export const useDismissNotificationAction = () => {
  const { notificationsStore, timeoutMapRef } = useNotificationContextValue();

  return (id: string): void => {
    const timeoutId = timeoutMapRef.current.get(id);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }

    const state = notificationsStore.get() ?? INITIAL_NOTIFICATION_STATE;

    notificationsStore.set({
      notifications: state.notifications.filter((n) => n.id !== id),
    });
  };
};
