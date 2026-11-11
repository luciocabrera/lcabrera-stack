import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTableDisplayPreferences,
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
  const tableDisplayPreferences = useGetGlobalTableDisplayPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();

  const draftStore = useStore<SettingsDraft>(
    toDraft({
      groupingPreferences,
      navigationPreferences,
      pinningPreferences,
      tableDisplayPreferences,
      tablePanelPreferences,
    }),
  );

  return (
    <SettingsDraftContext value={{ draftStore }}>
      {children}
    </SettingsDraftContext>
  );
};
