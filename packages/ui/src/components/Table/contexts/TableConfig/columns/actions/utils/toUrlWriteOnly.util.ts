import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

export const toUrlWriteOnly = ({
  searchParamKey,
  searchParamValue,
}: TablePersistenceEntry): TablePersistenceEntry => ({
  searchParamKey,
  ...(searchParamValue !== undefined && { searchParamValue }),
});
