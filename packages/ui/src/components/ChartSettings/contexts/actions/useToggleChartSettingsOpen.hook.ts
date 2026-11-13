import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useToggleChartSettingsOpen = () => {
  const { store } = useChartSettingsContextValue();

  return () => {
    const state = store.get();

    store.set({ draft: state.applied, isOpen: !state.isOpen });
  };
};
