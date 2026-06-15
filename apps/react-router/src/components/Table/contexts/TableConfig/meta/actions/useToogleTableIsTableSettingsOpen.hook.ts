import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsTableSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const isTableSettingsOpen = !metaState?.isTableSettingsOpen;

    metaStore.set({
      isColumnSettingsOpen: isTableSettingsOpen
        ? false
        : (metaState?.isColumnSettingsOpen ?? false),
      isTableSettingsOpen,
    });
  };
};
