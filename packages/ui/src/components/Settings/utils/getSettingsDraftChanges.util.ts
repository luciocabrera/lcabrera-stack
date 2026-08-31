import type { SettingsDraft } from '../Settings.types';
import type { SettingsDraftChanges } from '../SettingsDraftContext/SettingsDraftContext.types';

type GetSettingsDraftChangesArgs = {
  readonly baseline: SettingsDraft;
  readonly draft: SettingsDraft;
};

export const getSettingsDraftChanges = ({
  baseline,
  draft,
}: GetSettingsDraftChangesArgs): SettingsDraftChanges => {
  const hasGroupingChanges =
    draft.groupFold !== baseline.groupFold ||
    draft.groupingMode !== baseline.groupingMode ||
    draft.totalsPlacement !== baseline.totalsPlacement;

  const hasNavigationChanges =
    draft.navigationCollapsed !== baseline.navigationCollapsed ||
    draft.navigationSize !== baseline.navigationSize;

  const hasPinningChanges =
    draft.orderConflictResolution !== baseline.orderConflictResolution ||
    draft.pinSide !== baseline.pinSide ||
    draft.pinConflictResolution !== baseline.pinConflictResolution ||
    draft.unpinConflictResolution !== baseline.unpinConflictResolution;

  return {
    hasChanges: hasGroupingChanges || hasNavigationChanges || hasPinningChanges,
    hasGroupingChanges,
    hasNavigationChanges,
    hasPinningChanges,
  };
};
