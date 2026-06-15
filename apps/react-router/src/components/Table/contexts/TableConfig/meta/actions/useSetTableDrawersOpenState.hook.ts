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

    const wasTableSettingsOpenBeforeColumnSettings =
      isColumnSettingsOpen && !isTableSettingsOpen
        ? (metaState?.isTableSettingsOpen ?? false)
        : (metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false);

    metaStore.set({
      isColumnSettingsOpen,
      isTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings,
    });
  };
};
