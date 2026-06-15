import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const isColumnSettingsOpen = !metaState?.isColumnSettingsOpen;
    const wasTableSettingsOpenBeforeColumnSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

    const nextIsTableSettingsOpen = isColumnSettingsOpen
      ? false
      : wasTableSettingsOpenBeforeColumnSettings
        ? true
        : (metaState?.isTableSettingsOpen ?? false);

    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen: nextIsTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings: isColumnSettingsOpen
        ? (metaState?.isTableSettingsOpen ?? false)
        : false,
    });
  };
};
