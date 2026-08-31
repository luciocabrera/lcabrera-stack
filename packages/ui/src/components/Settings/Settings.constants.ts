import type {
  TableGroupFold,
  TableGroupingMode,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';
import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationSizePreference,
} from '#ui/types/globalSettings.types';

export const DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE: GlobalNavigationCollapsedPreference =
  'expanded';
export const DEFAULT_NAVIGATION_SIZE_PREFERENCE: GlobalNavigationSizePreference =
  'medium';
export const DEFAULT_PINNING_PREFERENCE = 'always-ask';

/**
 * Each is what the Table already does with no preference set, so a default-valued
 * draft persists nothing — see `toGlobalGroupingPreferencesUpdate`.
 */
export const DEFAULT_GROUPING_MODE_PREFERENCE: TableGroupingMode = 'flat';
export const DEFAULT_TOTALS_PLACEMENT_PREFERENCE: TableTotalsPlacement = 'last';
export const DEFAULT_GROUP_FOLD_PREFERENCE: TableGroupFold = 'expanded';
