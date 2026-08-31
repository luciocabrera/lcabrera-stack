import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { getSettingsDraftChanges, toDraft } from '../../utils';
import { useDraftStore } from '../useDraftStore.hook';

export const useGetSettingsDraftChanges = () => {
  const draft = useDraftStore((state) => state);
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();

  const baseline = toDraft({
    groupingPreferences,
    navigationPreferences,
    pinningPreferences,
  });

  return getSettingsDraftChanges({ baseline, draft });
};
