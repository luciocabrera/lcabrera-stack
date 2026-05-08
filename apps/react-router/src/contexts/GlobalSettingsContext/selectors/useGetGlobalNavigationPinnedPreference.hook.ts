import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalNavigationPinnedPreference = () => {
  return useGlobalSettingsStore((state) => state.navigation.pinned);
};
