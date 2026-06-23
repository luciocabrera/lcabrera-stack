import { useNotificationStore } from '../useNotificationStore.hook';

export const useGetNotifications = () => {
  return useNotificationStore((state) => state.notifications);
};
