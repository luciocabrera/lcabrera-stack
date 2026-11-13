import { useChartSettingsContextValue } from '../useChartSettingsContextValue.hook';

export const useCancelChartSettings = () => {
  const { store } = useChartSettingsContextValue();

  return () => {
    const state = store.get();

    store.set({ draft: state.applied, isOpen: false });
  };
};
