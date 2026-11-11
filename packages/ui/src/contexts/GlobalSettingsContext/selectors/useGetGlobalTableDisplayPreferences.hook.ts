import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalTableDisplayPreferences = () => {
  return useGlobalSettingsStore((state) => state.tableDisplay);
};
