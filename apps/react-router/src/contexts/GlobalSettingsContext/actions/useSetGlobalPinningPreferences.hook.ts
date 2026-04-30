import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { useGlobalSettingsContextValue } from '../useGlobalSettingsContextValue.hook';

import { usePersistGlobalSettingsAction } from './usePersistGlobalSettingsAction.hook';

import type { GlobalPinningPreferences } from '@/types/globalSettings.types';

export const useSetGlobalPinningPreferences = () => {
  const { settingsStore } = useGlobalSettingsContextValue();
  const persistGlobalSettings = usePersistGlobalSettingsAction();

  return (pinning: GlobalPinningPreferences) => {
    const settingsState = settingsStore.get() ?? INITIAL_GLOBAL_SETTINGS;

    const nextSettings = {
      pinning: {
        ...settingsState.pinning,
        ...pinning,
      },
    };

    settingsStore.set(nextSettings);
    persistGlobalSettings(nextSettings);
  };
};
