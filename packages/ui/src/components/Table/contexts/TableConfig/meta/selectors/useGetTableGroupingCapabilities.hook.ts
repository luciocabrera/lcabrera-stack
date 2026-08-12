import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

const NO_CAPABILITIES: Readonly<Record<string, TableColumnGroupingCapability>> =
  {};

/**
 * Every column's grouping capability, as the catalogue answered it (ADR-058)
 * and the loader shipped it (ADR-063).
 *
 * The empty answer is a module-level constant rather than a fresh `{}`: this is
 * read through `useSyncExternalStore`, which compares snapshots by identity, so
 * allocating here would report a change on every render.
 */
export const useGetTableGroupingCapabilities = () =>
  useMetaStore((state) => state.groupingCapabilities ?? NO_CAPABILITIES);
