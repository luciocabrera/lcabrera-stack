import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useToggleChartSettingsPinned = () => {
  const { store } = useChartSettingsContextValue();

  return () => {
    const state = store.get();

    store.set({ isPinned: !state.isPinned });
  };
};
