import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTableDisplayPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { toDraft } from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

export const useCancelSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tableDisplayPreferences = useGetGlobalTableDisplayPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();

  return () => {
    draftStore.set(
      toDraft({
        groupingPreferences,
        navigationPreferences,
        pinningPreferences,
        tableDisplayPreferences,
        tablePanelPreferences,
      }),
    );
  };
};
