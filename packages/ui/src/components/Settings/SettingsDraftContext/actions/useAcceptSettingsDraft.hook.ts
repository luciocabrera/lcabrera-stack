import {
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import {
  getSettingsDraftChanges,
  toDraft,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
} from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

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
