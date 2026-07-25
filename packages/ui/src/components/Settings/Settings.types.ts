import type { useGetGlobalNavigationPreferences } from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';
import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationSizePreference,
} from '@lcabrera/ui/types/globalSettings.types';
import type {
  OrderConflictResolutionPreferenceOption,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '@lcabrera/ui/types/pinningPreferences.types';

export type BuildNavigationUpdateArgs = {
  readonly draft: SettingsDraft;
  readonly navigationPreferences: ReturnType<
    typeof useGetGlobalNavigationPreferences
  >;
};

export type SettingsDraft = {
  readonly navigationCollapsed: GlobalNavigationCollapsedPreference;
  readonly navigationSize: GlobalNavigationSizePreference;
  readonly orderConflictResolution: OrderConflictResolutionPreferenceOption;
  readonly pinConflictResolution: PinConflictResolutionPreferenceOption;
  readonly pinSide: PinSidePreferenceOption;
  readonly unpinConflictResolution: UnpinConflictResolutionPreferenceOption;
};
