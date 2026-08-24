import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { getSettingsDraftChanges, toDraft } from '../../utils';
import { useDraftStore } from '../useDraftStore.hook';

export const useGetSettingsDraftChanges = () => {
  const draft = useDraftStore((state) => state);
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();

  const baseline = toDraft({ navigationPreferences, pinningPreferences });

  return getSettingsDraftChanges({ baseline, draft });
};
