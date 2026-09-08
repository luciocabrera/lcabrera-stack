import { useGlobalSettingsStore } from '../useGlobalSettingsStore.hook';

export const useGetGlobalTablePanelPreferences = () => {
  return useGlobalSettingsStore((state) => state.tablePanel);
};
