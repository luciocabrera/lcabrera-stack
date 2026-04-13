import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook.ts';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();

    metaStore.set({
      isColumnSettingsOpen: !metaState?.isColumnSettingsOpen,
    });
  };
};
