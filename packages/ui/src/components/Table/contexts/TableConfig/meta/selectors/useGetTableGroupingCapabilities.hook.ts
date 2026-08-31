import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

const NO_CAPABILITIES: Readonly<Record<string, TableColumnGroupingCapability>> =
  {};

export const useGetTableGroupingCapabilities = () =>
  useMetaStore((state) => state.groupingCapabilities ?? NO_CAPABILITIES);
