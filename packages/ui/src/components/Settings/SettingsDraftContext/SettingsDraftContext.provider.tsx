import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@repo/ui/contexts/GlobalSettingsContext/selectors';
import { useStore } from '@repo/ui/hooks';

import type { SettingsDraft } from '../Settings.types';
import type { SettingsDraftProviderProps } from './SettingsDraftContext.types';

import { toDraft } from '../utils';
import { SettingsDraftContext } from './SettingsDraftContext.context';

/**
 * Provides the settings draft store: the staged (uncommitted) copy of the
 * global navigation/pinning preferences, seeded from the persisted values on
 * mount. Tabs edit the draft; SettingsActions commits or discards it.
 */
export const SettingsDraftProvider = ({
  children,
}: SettingsDraftProviderProps) => {
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();

  const draftStore = useStore<SettingsDraft>(
    toDraft({ navigationPreferences, pinningPreferences }),
  );

  return (
    <SettingsDraftContext value={{ draftStore }}>
      {children}
    </SettingsDraftContext>
  );
};
