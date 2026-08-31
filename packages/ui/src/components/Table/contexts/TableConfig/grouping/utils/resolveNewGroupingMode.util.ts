import type { TableGroupingMode } from '#ui/components/Table/Table.types';

type ResolveNewGroupingModeArgs = {
  readonly keys: readonly string[];
  readonly preferredMode?: TableGroupingMode;
  readonly previousKeys: readonly string[];
  readonly previousMode: TableGroupingMode;
};

/**
 * The mode a key change leaves the grouping in: the one it already had, except where this
 * change **creates** the grouping — no keys before, keys after — which is the only moment
 * a reader's Global Settings answer is theirs to give.
 * Applied here rather than in the loader for the reason `resolveLoaderGrouping` records
 * about a route's default grouping: `flat` is dropped from the serialized param, so a
 * link whose author chose flat and one whose author never chose are the same string, and
 * a preference resolved there would re-apply itself every time the user switched back.
 */
export const resolveNewGroupingMode = ({
  keys,
  preferredMode,
  previousKeys,
  previousMode,
}: ResolveNewGroupingModeArgs): TableGroupingMode =>
  preferredMode !== undefined && previousKeys.length === 0 && keys.length > 0
    ? preferredMode
    : previousMode;
