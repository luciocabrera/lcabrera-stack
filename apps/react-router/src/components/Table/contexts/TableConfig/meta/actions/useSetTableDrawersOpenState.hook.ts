import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

type SetTableDrawersOpenStateArgs = {
  readonly isColumnSettingsOpen: boolean;
  readonly isTableSettingsOpen: boolean;
};

export const useSetTableDrawersOpenState = () => {
  const { metaStore } = useTableConfigContextValue();

  return ({
    isColumnSettingsOpen,
    isTableSettingsOpen,
  }: SetTableDrawersOpenStateArgs) => {
    const metaState = metaStore.get();

    const isSwitchingBetweenColumnSettings =
      isColumnSettingsOpen &&
      !isTableSettingsOpen &&
      (metaState?.isColumnSettingsOpen ?? false);

    const wasTableSettingsOpenBeforeColumnSettings =
      isSwitchingBetweenColumnSettings
        ? (metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false)
        : isColumnSettingsOpen && !isTableSettingsOpen
          ? (metaState?.isTableSettingsOpen ?? false)
          : (metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false);

    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings,
    });
  };
};
