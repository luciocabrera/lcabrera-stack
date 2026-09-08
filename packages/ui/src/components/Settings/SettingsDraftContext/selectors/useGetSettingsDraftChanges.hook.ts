import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { getSettingsDraftChanges, toDraft } from '../../utils';
import { useDraftStore } from '../useDraftStore.hook';

export const useGetSettingsDraftChanges = () => {
  const draft = useDraftStore((state) => state);
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();

  const baseline = toDraft({
    groupingPreferences,
    navigationPreferences,
    pinningPreferences,
    tablePanelPreferences,
  });

  return getSettingsDraftChanges({ baseline, draft });
};
