import { useChartSettingsStore } from '../useChartSettingsStore.hook';

export const useGetChartSettings = () =>
  useChartSettingsStore((state) => state.applied);
