import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalNavigationCollapsedPreference = () => {
  return useGlobalSettingsStore((state) => state.navigation.collapsed);
};
