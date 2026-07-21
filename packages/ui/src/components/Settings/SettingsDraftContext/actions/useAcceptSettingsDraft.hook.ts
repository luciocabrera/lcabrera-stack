import {
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';

import {
  getSettingsDraftChanges,
  toDraft,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
} from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

/**
 * Commit the staged settings draft to the global preferences store,
 * dispatching navigation and pinning updates only for the domains that
 * actually changed. No-op when the draft matches the persisted baseline.
 */
export const useAcceptSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return () => {
    const draft = draftStore.get();
    if (!draft) return;

    const baseline = toDraft({ navigationPreferences, pinningPreferences });
    const { hasChanges, hasNavigationChanges, hasPinningChanges } =
      getSettingsDraftChanges({ baseline, draft });

    if (!hasChanges) return;

    if (hasNavigationChanges) {
      const navigationUpdate = toGlobalNavigationPreferencesUpdate({
        draft,
        navigationPreferences,
      });

      if (navigationUpdate) {
        setGlobalNavigationPreferences(navigationUpdate);
      }
    }

    if (hasPinningChanges) {
      setGlobalPinningPreferences(toGlobalPinningPreferencesUpdate({ draft }));
    }
  };
};
