import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const isColumnSettingsOpen = !metaState?.isColumnSettingsOpen;

    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen: isColumnSettingsOpen
        ? false
        : (metaState?.isTableSettingsOpen ?? false),
    });
  };
};
