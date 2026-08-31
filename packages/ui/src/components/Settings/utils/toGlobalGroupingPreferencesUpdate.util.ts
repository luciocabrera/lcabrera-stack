import type { SettingsDraft } from '../Settings.types';

import {
  DEFAULT_GROUP_FOLD_PREFERENCE,
  DEFAULT_GROUPING_MODE_PREFERENCE,
  DEFAULT_TOTALS_PLACEMENT_PREFERENCE,
} from '../Settings.constants';

type ToGlobalGroupingPreferencesUpdateArgs = {
  readonly draft: SettingsDraft;
};

export const toGlobalGroupingPreferencesUpdate = ({
  draft,
}: ToGlobalGroupingPreferencesUpdateArgs) => {
  return {
    defaultFold:
      draft.groupFold === DEFAULT_GROUP_FOLD_PREFERENCE
        ? undefined
        : draft.groupFold,
    mode:
      draft.groupingMode === DEFAULT_GROUPING_MODE_PREFERENCE
        ? undefined
        : draft.groupingMode,
    totalsPlacement:
      draft.totalsPlacement === DEFAULT_TOTALS_PLACEMENT_PREFERENCE
        ? undefined
        : draft.totalsPlacement,
  };
};
