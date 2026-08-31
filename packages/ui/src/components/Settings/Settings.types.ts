import type {
  TableGroupFold,
  TableGroupingMode,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';
import type { useGetGlobalNavigationPreferences } from '#ui/contexts/GlobalSettingsContext/selectors';
import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationSizePreference,
} from '#ui/types/globalSettings.types';
import type {
  OrderConflictResolutionPreferenceOption,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '#ui/types/pinningPreferences.types';

export type BuildNavigationUpdateArgs = {
  readonly draft: SettingsDraft;
  readonly navigationPreferences: ReturnType<
    typeof useGetGlobalNavigationPreferences
  >;
};

export type SettingsDraft = {
  readonly groupFold: TableGroupFold;
  readonly groupingMode: TableGroupingMode;
  readonly navigationCollapsed: GlobalNavigationCollapsedPreference;
  readonly navigationSize: GlobalNavigationSizePreference;
  readonly orderConflictResolution: OrderConflictResolutionPreferenceOption;
  readonly pinConflictResolution: PinConflictResolutionPreferenceOption;
  readonly pinSide: PinSidePreferenceOption;
  readonly totalsPlacement: TableTotalsPlacement;
  readonly unpinConflictResolution: UnpinConflictResolutionPreferenceOption;
};
