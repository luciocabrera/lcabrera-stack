import type { SettingsDraft } from '../Settings.types';
import type { SettingsDraftChanges } from '../SettingsDraftContext/SettingsDraftContext.types';

type GetSettingsDraftChangesArgs = {
  readonly baseline: SettingsDraft;
  readonly draft: SettingsDraft;
};

/**
 * Diffs the staged settings draft against the baseline (the persisted
 * preferences resolved through the same toDraft defaults), split by domain
 * so accept can commit navigation and pinning updates independently.
 */
export const getSettingsDraftChanges = ({
  baseline,
  draft,
}: GetSettingsDraftChangesArgs): SettingsDraftChanges => {
  const hasNavigationChanges =
    draft.navigationCollapsed !== baseline.navigationCollapsed ||
    draft.navigationSize !== baseline.navigationSize;

  const hasPinningChanges =
    draft.orderConflictResolution !== baseline.orderConflictResolution ||
    draft.pinSide !== baseline.pinSide ||
    draft.pinConflictResolution !== baseline.pinConflictResolution ||
    draft.unpinConflictResolution !== baseline.unpinConflictResolution;

  return {
    hasChanges: hasNavigationChanges || hasPinningChanges,
    hasNavigationChanges,
    hasPinningChanges,
  };
};
