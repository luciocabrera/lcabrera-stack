import { persistTableMetaUiState } from '@/components/Table/utils';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useToogleTableIsColumnSettingsOpen = () => {
  const { metaStore } = useTableConfigContextValue();

  return () => {
    const metaState = metaStore.get();
    const isColumnSettingsOpen = !metaState?.isColumnSettingsOpen;
    const wasTableSettingsOpenBeforeColumnSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

    let nextIsTableSettingsOpen = metaState?.isTableSettingsOpen ?? false;

    if (isColumnSettingsOpen) {
      nextIsTableSettingsOpen = false;
    } else if (wasTableSettingsOpenBeforeColumnSettings) {
      nextIsTableSettingsOpen = true;
    }

    const nextStatePatch = {
      isColumnSettingsOpen,
      isTableSettingsOpen: nextIsTableSettingsOpen,
      wasTableSettingsOpenBeforeColumnSettings: isColumnSettingsOpen
        ? (metaState?.isTableSettingsOpen ?? false)
        : false,
    };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
