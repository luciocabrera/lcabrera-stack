import { SAME_AS_ROWS_PREFERENCE } from '#ui/constants/tableDisplayPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import { DEFAULT_TABLE_DENSITY_PREFERENCE } from '../Settings.constants';

type ToGlobalTableDisplayPreferencesUpdateArgs = {
  readonly draft: SettingsDraft;
};

export const toGlobalTableDisplayPreferencesUpdate = ({
  draft,
}: ToGlobalTableDisplayPreferencesUpdateArgs) => {
  return {
    density:
      draft.tableDensity === DEFAULT_TABLE_DENSITY_PREFERENCE
        ? undefined
        : draft.tableDensity,
    headerDensity:
      draft.tableHeaderDensity === SAME_AS_ROWS_PREFERENCE
        ? undefined
        : draft.tableHeaderDensity,
    titleDensity:
      draft.tableTitleDensity === SAME_AS_ROWS_PREFERENCE
        ? undefined
        : draft.tableTitleDensity,
  };
};
