import type { useGetGlobalNavigationPreferences } from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';
import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationPinnedPreference,
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
  readonly navigationPinned: GlobalNavigationPinnedPreference;
  readonly navigationSize: GlobalNavigationSizePreference;
  readonly orderConflictResolution: OrderConflictResolutionPreferenceOption;
  readonly pinConflictResolution: PinConflictResolutionPreferenceOption;
  readonly pinSide: PinSidePreferenceOption;
  readonly unpinConflictResolution: UnpinConflictResolutionPreferenceOption;
};
