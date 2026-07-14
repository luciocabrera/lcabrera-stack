import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

type GetIsTableSettingsOpenArgs = {
  readonly metaState?: Partial<TableMetaState>;
};

export const getIsTableSettingsOpen = ({
  metaState,
}: GetIsTableSettingsOpenArgs) => {
  const shouldRestoreTableSettings =
    metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

  return shouldRestoreTableSettings
    ? true
    : (metaState?.isTableSettingsOpen ?? false);
};
