import { useChartSettingsStore } from '../useChartSettingsStore.hook';

export const useGetIsChartSettingsOpen = () =>
  useChartSettingsStore((state) => state.isOpen);
