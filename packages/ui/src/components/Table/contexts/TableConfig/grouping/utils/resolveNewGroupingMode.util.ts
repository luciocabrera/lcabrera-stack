import type { TableGroupingMode } from '#ui/components/Table/Table.types';

type ResolveNewGroupingModeArgs = {
  readonly keys: readonly string[];
  readonly preferredMode?: TableGroupingMode;
  readonly previousKeys: readonly string[];
  readonly previousMode: TableGroupingMode;
};

export const resolveNewGroupingMode = ({
  keys,
  preferredMode,
  previousKeys,
  previousMode,
}: ResolveNewGroupingModeArgs): TableGroupingMode =>
  preferredMode !== undefined && previousKeys.length === 0 && keys.length > 0
    ? preferredMode
    : previousMode;
