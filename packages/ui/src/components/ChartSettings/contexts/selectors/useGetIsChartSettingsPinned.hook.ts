import { useChartSettingsStore } from '../useChartSettingsStore.hook';

export const useGetIsChartSettingsPinned = () =>
  useChartSettingsStore((state) => state.isPinned);
