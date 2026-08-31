import {
  useSetGlobalGroupingPreferences,
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import {
  getSettingsDraftChanges,
  toDraft,
  toGlobalGroupingPreferencesUpdate,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
} from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

export const useAcceptSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalGroupingPreferences = useSetGlobalGroupingPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  return () => {
    const draft = draftStore.get();
    if (!draft) return;

    const baseline = toDraft({
      groupingPreferences,
      navigationPreferences,
      pinningPreferences,
    });
    const {
      hasChanges,
      hasGroupingChanges,
      hasNavigationChanges,
      hasPinningChanges,
    } = getSettingsDraftChanges({ baseline, draft });

    if (!hasChanges) return;

    if (hasGroupingChanges) {
      setGlobalGroupingPreferences(
        toGlobalGroupingPreferencesUpdate({ draft }),
      );
    }

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
