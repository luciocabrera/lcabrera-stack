import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

const NO_CAPABILITIES: Readonly<Record<string, TableColumnGroupingCapability>> =
  {};

/**
 * Every column's grouping capability, as the catalogue answered it (ADR-058) and the
 * loader shipped it (ADR-063).
 */
export const useGetTableGroupingCapabilities = () =>
  useMetaStore((state) => state.groupingCapabilities ?? NO_CAPABILITIES);
