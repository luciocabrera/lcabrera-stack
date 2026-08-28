import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

/** An entry may carry both halves; this keeps the URL one (ADR-094). */
export const toUrlWriteOnly = ({
  searchParamKey,
  searchParamValue,
}: TablePersistenceEntry): TablePersistenceEntry => ({
  searchParamKey,
  ...(searchParamValue !== undefined && { searchParamValue }),
});
