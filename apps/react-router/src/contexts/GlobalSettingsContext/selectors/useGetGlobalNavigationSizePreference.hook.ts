import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalNavigationSizePreference = () => {
  return useGlobalSettingsStore((state) => state.navigation.size);
};
