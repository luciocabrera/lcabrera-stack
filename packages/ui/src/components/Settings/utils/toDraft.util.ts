import type {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import type { SettingsDraft } from '../Settings.types';

import {
  DEFAULT_GROUP_FOLD_PREFERENCE,
  DEFAULT_GROUPING_MODE_PREFERENCE,
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
  DEFAULT_NAVIGATION_SIZE_PREFERENCE,
  DEFAULT_PINNING_PREFERENCE,
  DEFAULT_TOTALS_PLACEMENT_PREFERENCE,
} from '../Settings.constants';

type ToDraftArgs = {
  readonly groupingPreferences: ReturnType<
    typeof useGetGlobalGroupingPreferences
  >;
  readonly navigationPreferences: ReturnType<
    typeof useGetGlobalNavigationPreferences
  >;
  readonly pinningPreferences: ReturnType<
    typeof useGetGlobalPinningPreferences
  >;
};

export const toDraft = ({
  groupingPreferences,
  navigationPreferences,
  pinningPreferences,
}: ToDraftArgs): SettingsDraft => {
  return {
    groupFold: groupingPreferences.defaultFold ?? DEFAULT_GROUP_FOLD_PREFERENCE,
    groupingMode: groupingPreferences.mode ?? DEFAULT_GROUPING_MODE_PREFERENCE,
    navigationCollapsed:
      navigationPreferences.collapsed ??
      DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
    navigationSize:
      navigationPreferences.size ?? DEFAULT_NAVIGATION_SIZE_PREFERENCE,
    orderConflictResolution:
      pinningPreferences.orderConflictResolution ?? DEFAULT_PINNING_PREFERENCE,
    pinConflictResolution:
      pinningPreferences.pinConflictResolution ?? DEFAULT_PINNING_PREFERENCE,
    pinSide: pinningPreferences.pinSide ?? DEFAULT_PINNING_PREFERENCE,
    totalsPlacement:
      groupingPreferences.totalsPlacement ??
      DEFAULT_TOTALS_PLACEMENT_PREFERENCE,
    unpinConflictResolution:
      pinningPreferences.unpinConflictResolution ?? DEFAULT_PINNING_PREFERENCE,
  };
};
