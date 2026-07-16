import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalNavigationPreferences = () => {
  return useGlobalSettingsStore((state) => state.navigation);
};
