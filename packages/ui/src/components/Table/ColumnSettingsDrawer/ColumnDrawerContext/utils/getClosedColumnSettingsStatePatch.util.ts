import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { getIsTableSettingsOpen } from '@lcabrera/ui/components/Table/utils';

type GetClosedColumnSettingsStatePatchArgs = {
  readonly metaState?: Partial<TableMetaState>;
};

export const getClosedColumnSettingsStatePatch = ({
  metaState,
}: GetClosedColumnSettingsStatePatchArgs) => ({
  isColumnSettingsOpen: false,
  isTableSettingsOpen: getIsTableSettingsOpen({ metaState }),
  wasTableSettingsOpenBeforeColumnSettings: false,
});
