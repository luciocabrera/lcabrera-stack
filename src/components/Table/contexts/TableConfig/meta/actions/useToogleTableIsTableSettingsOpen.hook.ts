import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();
  const metaState = metaStore.get();

  return () => {
    metaStore.set({
      isTableSettingsOpen: !metaState?.isTableSettingsOpen,
    });
  };
};
