import type { SkeletonResponse } from './TableSkeleton.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import {
  useGetTablePersistenceKey,
  useGetTablePlaceholderRowCount,
} from '../contexts/TableConfig/meta/selectors';
import { Table } from '../Table.component';
import { generatePlaceholderData } from '../TableBody/utils';
import { readPersistedDataStateFromSessionStorage } from '../utils';

export const TableSkeleton = () => {
  const columns = useGetColumns();
  const persistenceKey = useGetTablePersistenceKey();
  const placeholderRowCount = useGetTablePlaceholderRowCount();
  const persistedDataState = readPersistedDataStateFromSessionStorage<
    Record<string, unknown>
  >({
    persistenceKey,
  });
  const hasPersistedRows = (persistedDataState?.data.length ?? 0) > 0;
  const placeholderData = generatePlaceholderData<Record<string, unknown>>({
    columns,
    rowCount: placeholderRowCount,
  });
  const effectiveData = hasPersistedRows
    ? (persistedDataState?.data ?? [])
    : placeholderData;
  const totalRows = hasPersistedRows
    ? (persistedDataState?.totalRows ?? effectiveData.length)
    : effectiveData.length;

  return (
    <Table<Record<string, unknown>, SkeletonResponse>
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.totalRows}
      isLoading
      response={{ data: effectiveData, totalRows }}
    />
  );
};
