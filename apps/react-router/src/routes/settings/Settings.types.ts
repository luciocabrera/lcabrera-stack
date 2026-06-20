import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationPinnedPreference,
  GlobalNavigationSizePreference,
} from '@/types/globalSettings.types';
import type {
  OrderConflictResolutionPreferenceOption,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';

import { useGetGlobalNavigationPreferences } from '@/contexts/GlobalSettingsContext/selectors';

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
