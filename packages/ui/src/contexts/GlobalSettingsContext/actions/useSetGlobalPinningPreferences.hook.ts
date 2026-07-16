import type { GlobalPinningPreferences } from '@repo/ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';
import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

export const useSetGlobalPinningPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (pinning: GlobalPinningPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      ...settingsState,
      pinning: {
        ...settingsState.pinning,
        ...pinning,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
