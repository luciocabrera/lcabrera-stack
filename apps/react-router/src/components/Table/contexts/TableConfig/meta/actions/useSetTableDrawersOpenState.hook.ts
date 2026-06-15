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

    const isOpeningColumnSettings =
      isColumnSettingsOpen && !isTableSettingsOpen;

    let wasTableSettingsOpenBeforeColumnSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

    if (isSwitchingBetweenColumnSettings) {
      wasTableSettingsOpenBeforeColumnSettings =
        metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;
    } else if (isOpeningColumnSettings) {
      wasTableSettingsOpenBeforeColumnSettings =
        metaState?.isTableSettingsOpen ?? false;
    }

    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings,
    });
  };
};
