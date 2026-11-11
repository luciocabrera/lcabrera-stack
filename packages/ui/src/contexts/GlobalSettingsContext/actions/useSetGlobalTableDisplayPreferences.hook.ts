import type { GlobalTableDisplayPreferences } from '#ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';
import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

export const useSetGlobalTableDisplayPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (tableDisplay: GlobalTableDisplayPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      ...settingsState,
      tableDisplay: {
        ...settingsState.tableDisplay,
        ...tableDisplay,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
