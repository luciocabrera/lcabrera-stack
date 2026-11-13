import type { ChartSettingsValues } from '../../ChartSettings.types';

import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useStageChartSettings = () => {
  const { store } = useChartSettingsContextValue();

  return (patch: Partial<ChartSettingsValues>) => {
    const state = store.get();

    store.set({ draft: { ...state.draft, ...patch } });
  };
};
