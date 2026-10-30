import type {
  TableDensity,
  TableMetaState,
} from '#ui/components/Table/Table.types';

type ResolveSettingsStatePatchArgs = {
  readonly density: TableDensity | undefined;
  readonly metaState: Partial<TableMetaState> | undefined;
};

export const resolveSettingsStatePatch = ({
  density,
  metaState,
}: ResolveSettingsStatePatchArgs) => {
  const isClosesSettings = metaState?.isTableSettingsPinned !== true;
  const closePatch = isClosesSettings
    ? { isTableSettingsOpen: false as const }
    : {};
  const densityPatch = density === undefined ? {} : { density };

  return {
    closesSettings: isClosesSettings,
    hasDensityChanged: density !== undefined,
    nextStatePatch: { ...closePatch, ...densityPatch },
  };
};
