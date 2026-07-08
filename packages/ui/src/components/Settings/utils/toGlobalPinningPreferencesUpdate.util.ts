import type { SettingsDraft } from '../Settings.types';

import { DEFAULT_PINNING_PREFERENCE } from '../Settings.constants';

type ToGlobalPinningPreferencesUpdateArgs = {
  readonly draft: SettingsDraft;
};

export const toGlobalPinningPreferencesUpdate = ({
  draft,
}: ToGlobalPinningPreferencesUpdateArgs) => {
  return {
    orderConflictResolution:
      draft.orderConflictResolution === DEFAULT_PINNING_PREFERENCE
        ? undefined
        : draft.orderConflictResolution,
    pinConflictResolution:
      draft.pinConflictResolution === DEFAULT_PINNING_PREFERENCE
        ? undefined
        : draft.pinConflictResolution,
    pinSide:
      draft.pinSide === DEFAULT_PINNING_PREFERENCE ? undefined : draft.pinSide,
    unpinConflictResolution:
      draft.unpinConflictResolution === DEFAULT_PINNING_PREFERENCE
        ? undefined
        : draft.unpinConflictResolution,
  };
};
