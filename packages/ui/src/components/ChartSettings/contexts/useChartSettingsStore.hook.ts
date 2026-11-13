import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import type { ChartSettingsState } from '../ChartSettings.types';

import { useChartSettingsContextValue } from './useChartSettingsContextValue.hook';

export const useChartSettingsStore = <TSelected>(
  selector: (state: ChartSettingsState) => TSelected,
) => {
  const { store } = useChartSettingsContextValue();

  return useStoreSelector({ selector, store });
};
