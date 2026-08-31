import type { GlobalGroupingPreferences } from '#ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';
import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

export const useSetGlobalGroupingPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (grouping: GlobalGroupingPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      ...settingsState,
      grouping: {
        ...settingsState.grouping,
        ...grouping,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
