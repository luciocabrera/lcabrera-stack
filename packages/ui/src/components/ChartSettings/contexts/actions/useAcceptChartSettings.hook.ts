import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useAcceptChartSettings = () => {
  const { store } = useChartSettingsContextValue();

  return () => {
    const state = store.get();

    store.set({ applied: state.draft, isOpen: state.isPinned });
  };
};
