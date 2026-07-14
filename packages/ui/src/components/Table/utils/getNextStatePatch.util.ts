import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

import { getIsTableSettingsOpen } from './getIsTableSettingsOpen.util';

type GetNextStatePatchArgs = {
  readonly metaState?: Partial<TableMetaState>;
};

export const getNextStatePatch = ({ metaState }: GetNextStatePatchArgs) => {
  if (metaState?.isColumnSettingsPinned ?? false) {
    return {
      isColumnSettingsOpen: true,
    };
  }

  return {
    isColumnSettingsOpen: false,
    isTableSettingsOpen: getIsTableSettingsOpen({ metaState }),
    wasTableSettingsOpenBeforeColumnSettings: false,
  };
};
