import { persistTableMetaUiState } from '@repo/ui/components/Table/utils';

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

    const isOpeningColumnSettings =
      isColumnSettingsOpen && !isTableSettingsOpen;

    const isSwitchingBetweenColumnSettings =
      isOpeningColumnSettings && (metaState?.isColumnSettingsOpen ?? false);

    let wasTableSettingsOpenBeforeColumnSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

    if (isSwitchingBetweenColumnSettings) {
      wasTableSettingsOpenBeforeColumnSettings =
        metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;
    } else if (isOpeningColumnSettings) {
      wasTableSettingsOpenBeforeColumnSettings =
        metaState?.isTableSettingsOpen ?? false;
    }

    const nextStatePatch = {
      isColumnSettingsOpen,
      isTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings,
    };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
