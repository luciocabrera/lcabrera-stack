import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { getIsTableSettingsOpen } from './getIsTableSettingsOpen.util';

type GetColumnSettingsNextStatePatchArgs = {
  readonly metaState?: Partial<TableMetaState>;
};

export const getColumnSettingsNextStatePatch = ({
  metaState,
}: GetColumnSettingsNextStatePatchArgs) => {
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
