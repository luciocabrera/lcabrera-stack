import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();
  const metaState = metaStore.get();

  return () => {
    metaStore.set({
      isColumnSettingsOpen: !metaState?.isColumnSettingsOpen,
    });
  };
};
