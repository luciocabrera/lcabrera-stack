import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalGroupingPreferences = () => {
  return useGlobalSettingsStore((state) => state.grouping);
};
