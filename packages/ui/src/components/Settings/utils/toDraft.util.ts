import type {
  useGetGlobalGroupingPreferences,
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
  useGetGlobalTableDisplayPreferences,
  useGetGlobalTablePanelPreferences,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { resolveSettingsTabOrder } from '#ui/components/Table/utils/resolveSettingsTabOrder.util';
import { SAME_AS_ROWS_PREFERENCE } from '#ui/constants/tableDisplayPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import {
  DEFAULT_GROUP_FOLD_PREFERENCE,
  DEFAULT_GROUPING_MODE_PREFERENCE,
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
  DEFAULT_NAVIGATION_SIZE_PREFERENCE,
  DEFAULT_PINNING_PREFERENCE,
  DEFAULT_TABLE_DENSITY_PREFERENCE,
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
  readonly tableDisplayPreferences: ReturnType<
    typeof useGetGlobalTableDisplayPreferences
  >;
  readonly tablePanelPreferences: ReturnType<
    typeof useGetGlobalTablePanelPreferences
  >;
};

export const toDraft = ({
  groupingPreferences,
  navigationPreferences,
  pinningPreferences,
  tableDisplayPreferences,
  tablePanelPreferences,
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
    settingsTabOrder: resolveSettingsTabOrder(
      tablePanelPreferences.settingsTabOrder,
    ),
    tableDensity:
      tableDisplayPreferences.density ?? DEFAULT_TABLE_DENSITY_PREFERENCE,
    tableHeaderDensity:
      tableDisplayPreferences.headerDensity ?? SAME_AS_ROWS_PREFERENCE,
    tableTitleDensity:
      tableDisplayPreferences.titleDensity ?? SAME_AS_ROWS_PREFERENCE,
    totalsPlacement:
      groupingPreferences.totalsPlacement ??
      DEFAULT_TOTALS_PLACEMENT_PREFERENCE,
    unpinConflictResolution:
      pinningPreferences.unpinConflictResolution ?? DEFAULT_PINNING_PREFERENCE,
  };
};
