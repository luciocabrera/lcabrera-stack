import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();

    metaStore.set({
      isTableSettingsOpen: !metaState?.isTableSettingsOpen,
    });
  };
};
