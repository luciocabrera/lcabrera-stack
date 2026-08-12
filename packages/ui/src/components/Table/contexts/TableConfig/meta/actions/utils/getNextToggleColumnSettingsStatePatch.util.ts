import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getIsTableSettingsOpen } from '#ui/components/Table/utils';

type GetNextToggleColumnSettingsStatePatchArgs = {
  readonly metaState?: Partial<TableMetaState>;
};

export const getNextToggleColumnSettingsStatePatch = ({
  metaState,
}: GetNextToggleColumnSettingsStatePatchArgs) => {
  const isColumnSettingsOpen = !(metaState?.isColumnSettingsOpen ?? false);

  return {
    isColumnSettingsOpen,
    isTableSettingsOpen: isColumnSettingsOpen
      ? false
      : getIsTableSettingsOpen({ metaState }),
    wasTableSettingsOpenBeforeColumnSettings: isColumnSettingsOpen
      ? (metaState?.isTableSettingsOpen ?? false)
      : false,
  };
};
