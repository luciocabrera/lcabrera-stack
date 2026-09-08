import {
  useSetGlobalGroupingPreferences,
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
  useSetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import {
  getSettingsDraftChanges,
  toDraft,
  toGlobalGroupingPreferencesUpdate,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
  toGlobalTablePanelPreferencesUpdate,
} from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

export const useAcceptSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();
  const setGlobalGroupingPreferences = useSetGlobalGroupingPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();
  const setGlobalTablePanelPreferences = useSetGlobalTablePanelPreferences();

  return () => {
    const draft = draftStore.get();
    if (!draft) return;

    const baseline = toDraft({
      groupingPreferences,
      navigationPreferences,
      pinningPreferences,
      tablePanelPreferences,
    });
    const {
      hasChanges,
      hasGroupingChanges,
      hasNavigationChanges,
      hasPinningChanges,
      hasTablePanelChanges,
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

    if (hasTablePanelChanges) {
      setGlobalTablePanelPreferences(
        toGlobalTablePanelPreferencesUpdate({ draft }),
      );
    }
  };
};
