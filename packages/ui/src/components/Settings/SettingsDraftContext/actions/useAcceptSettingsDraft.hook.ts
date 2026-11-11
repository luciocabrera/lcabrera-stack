import {
  useSetGlobalGroupingPreferences,
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
  useSetGlobalTableDisplayPreferences,
  useSetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTableDisplayPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import {
  getSettingsDraftChanges,
  toDraft,
  toGlobalGroupingPreferencesUpdate,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
  toGlobalTableDisplayPreferencesUpdate,
  toGlobalTablePanelPreferencesUpdate,
} from '../../utils';
import { useSettingsDraftContextValue } from '../useSettingsDraftContextValue.hook';

export const useAcceptSettingsDraft = () => {
  const { draftStore } = useSettingsDraftContextValue();
  const groupingPreferences = useGetGlobalGroupingPreferences();
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const tableDisplayPreferences = useGetGlobalTableDisplayPreferences();
  const tablePanelPreferences = useGetGlobalTablePanelPreferences();
  const setGlobalGroupingPreferences = useSetGlobalGroupingPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();
  const setGlobalTableDisplayPreferences =
    useSetGlobalTableDisplayPreferences();
  const setGlobalTablePanelPreferences = useSetGlobalTablePanelPreferences();

  return () => {
    const draft = draftStore.get();
    if (!draft) return;

    const baseline = toDraft({
      groupingPreferences,
      navigationPreferences,
      pinningPreferences,
      tableDisplayPreferences,
      tablePanelPreferences,
    });
    const {
      hasChanges,
      hasGroupingChanges,
      hasNavigationChanges,
      hasPinningChanges,
      hasTableDisplayChanges,
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

    if (hasTableDisplayChanges) {
      setGlobalTableDisplayPreferences(
        toGlobalTableDisplayPreferencesUpdate({ draft }),
      );
    }

    if (hasTablePanelChanges) {
      setGlobalTablePanelPreferences(
        toGlobalTablePanelPreferencesUpdate({ draft }),
      );
    }
  };
};
