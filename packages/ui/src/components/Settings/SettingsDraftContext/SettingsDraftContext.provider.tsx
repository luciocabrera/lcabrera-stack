import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';
import { useStore } from '#ui/hooks';

import type { SettingsDraft } from '../Settings.types';
import type { SettingsDraftProviderProps } from './SettingsDraftContext.types';

import { toDraft } from '../utils';
import { SettingsDraftContext } from './SettingsDraftContext.context';

export const SettingsDraftProvider = ({
  children,
}: SettingsDraftProviderProps) => {
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();

  const draftStore = useStore<SettingsDraft>(
    toDraft({
      groupingPreferences,
      navigationPreferences,
      pinningPreferences,
      tablePanelPreferences,
    }),
  );

  return (
    <SettingsDraftContext value={{ draftStore }}>
      {children}
    </SettingsDraftContext>
  );
};
