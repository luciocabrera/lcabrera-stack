import type {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@lcabrera/ui/contexts/GlobalSettingsContext/selectors';

import type { SettingsDraft } from '../Settings.types';

import {
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
  DEFAULT_NAVIGATION_SIZE_PREFERENCE,
  DEFAULT_PINNING_PREFERENCE,
} from '../Settings.constants';

type ToDraftArgs = {
  readonly navigationPreferences: ReturnType<
    typeof useGetGlobalNavigationPreferences
  >;
  readonly pinningPreferences: ReturnType<
    typeof useGetGlobalPinningPreferences
  >;
};

export const toDraft = ({
  navigationPreferences,
  pinningPreferences,
}: ToDraftArgs): SettingsDraft => {
  return {
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
    unpinConflictResolution:
      pinningPreferences.unpinConflictResolution ?? DEFAULT_PINNING_PREFERENCE,
  };
};
