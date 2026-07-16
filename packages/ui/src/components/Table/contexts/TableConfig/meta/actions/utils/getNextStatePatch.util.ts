import type { TableMetaState } from '@repo/ui/components/Table/Table.types';

type GetNextStatePatchArgs = {
  readonly isColumnSettingsOpen: boolean;
  readonly isTableSettingsOpen: boolean;
  readonly metaState?: Partial<TableMetaState>;
};

export const getNextStatePatch = ({
  isColumnSettingsOpen,
  isTableSettingsOpen,
  metaState,
}: GetNextStatePatchArgs) => {
  const isOpeningColumnSettings = isColumnSettingsOpen && !isTableSettingsOpen;

  const isSwitchingBetweenColumnSettings =
    isOpeningColumnSettings && (metaState?.isColumnSettingsOpen ?? false);

  let wasTableSettingsOpenBeforeColumnSettings =
    metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;

  if (isSwitchingBetweenColumnSettings) {
    wasTableSettingsOpenBeforeColumnSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;
  } else if (isOpeningColumnSettings) {
    wasTableSettingsOpenBeforeColumnSettings =
      metaState?.isTableSettingsOpen ?? false;
  }

  return {
    isColumnSettingsOpen,
    isTableSettingsOpen,
    wasTableSettingsOpenBeforeColumnSettings,
  };
};
