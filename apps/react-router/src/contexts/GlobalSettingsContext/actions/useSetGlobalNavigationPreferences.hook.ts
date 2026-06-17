import type { GlobalNavigationPreferences } from '@/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';
import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

export const useSetGlobalNavigationPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (navigation: GlobalNavigationPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      ...settingsState,
      navigation: {
        ...settingsState.navigation,
        ...navigation,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
