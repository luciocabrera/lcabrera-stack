import type {
  TableDensityPatch,
  TableMetaState,
} from '#ui/components/Table/Table.types';

type ResolveSettingsStatePatchArgs = {
  readonly densityPatch: TableDensityPatch | undefined;
  readonly metaState: Partial<TableMetaState> | undefined;
};

export const resolveSettingsStatePatch = ({
  densityPatch = {},
  metaState,
}: ResolveSettingsStatePatchArgs) => {
  const isClosesSettings = metaState?.isTableSettingsPinned !== true;
  const closePatch = isClosesSettings
    ? { isTableSettingsOpen: false as const }
    : {};

  return {
    closesSettings: isClosesSettings,
    hasDensityChanged:
      'density' in densityPatch ||
      'headerDensity' in densityPatch ||
      'titleDensity' in densityPatch,
    nextStatePatch: { ...closePatch, ...densityPatch },
  };
};
