import type { SettingsDraft } from '../Settings.types';

import {
  DEFAULT_TABLE_DENSITY_PREFERENCE,
  DEFAULT_TABLE_HEADER_DENSITY_PREFERENCE,
} from '../Settings.constants';

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
      draft.tableHeaderDensity === DEFAULT_TABLE_HEADER_DENSITY_PREFERENCE
        ? undefined
        : draft.tableHeaderDensity,
  };
};
