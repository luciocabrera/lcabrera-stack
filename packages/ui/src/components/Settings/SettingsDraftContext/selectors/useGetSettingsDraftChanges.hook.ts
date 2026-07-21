import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';

import { getSettingsDraftChanges, toDraft } from '../../utils';
import { useDraftStore } from '../useDraftStore.hook';

/**
 * Per-domain dirty flags for the staged settings draft, diffed against the
 * persisted preferences resolved through the same toDraft defaults.
 */
export const useGetSettingsDraftChanges = () => {
  const draft = useDraftStore((state) => state);
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();

  const baseline = toDraft({ navigationPreferences, pinningPreferences });

  return getSettingsDraftChanges({ baseline, draft });
};
