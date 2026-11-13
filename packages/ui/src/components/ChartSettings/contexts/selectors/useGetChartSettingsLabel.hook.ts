import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useGetChartSettingsLabel = () =>
  useChartSettingsContextValue().label;
