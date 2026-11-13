import { useChartSettingsStore } from '../useChartSettingsStore.hook';

export const useGetChartSettingsDraft = () =>
  useChartSettingsStore((state) => state.draft);
