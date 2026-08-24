import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';
import { useStore } from '#ui/hooks';

import type { SettingsDraft } from '../Settings.types';
import type { SettingsDraftProviderProps } from './SettingsDraftContext.types';

import { toDraft } from '../utils';
import { SettingsDraftContext } from './SettingsDraftContext.context';

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
