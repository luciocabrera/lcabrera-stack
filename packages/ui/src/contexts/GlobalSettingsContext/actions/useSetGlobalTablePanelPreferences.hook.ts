import type { GlobalTablePanelPreferences } from '#ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';
import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

export const useSetGlobalTablePanelPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (tablePanel: GlobalTablePanelPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      ...settingsState,
      tablePanel: {
        ...settingsState.tablePanel,
        ...tablePanel,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
