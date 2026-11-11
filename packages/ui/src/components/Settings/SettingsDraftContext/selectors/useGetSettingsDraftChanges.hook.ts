import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTableDisplayPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { getSettingsDraftChanges, toDraft } from '../../utils';
import { useDraftStore } from '../useDraftStore.hook';

export const useGetSettingsDraftChanges = () => {
  const draft = useDraftStore((state) => state);
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tableDisplayPreferences = useGetGlobalTableDisplayPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();

  const baseline = toDraft({
    groupingPreferences,
    navigationPreferences,
    pinningPreferences,
    tableDisplayPreferences,
    tablePanelPreferences,
  });

  return getSettingsDraftChanges({ baseline, draft });
};
