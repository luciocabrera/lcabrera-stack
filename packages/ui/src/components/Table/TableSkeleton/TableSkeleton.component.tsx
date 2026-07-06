import { useMemo } from 'react';

import type {
  SkeletonResponse,
  TableSkeletonProps,
} from './TableSkeleton.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import {
  useGetTableAppId,
  useGetTablePersistenceKey,
  useGetTablePlaceholderRowCount,
} from '../contexts/TableConfig/meta/selectors';
import { Table } from '../Table.component';
import { generatePlaceholderData } from '../TableBody/utils';
import { readPersistedDataStateFromSessionStorage } from '../utils';

export const TableSkeleton = <TData extends Record<string, unknown>>({
  actions,
  crud,
}: TableSkeletonProps<TData>) => {
  const columns = useGetColumns<TData>();
  const appId = useGetTableAppId();
  const persistenceKey = useGetTablePersistenceKey();
  const placeholderRowCount = useGetTablePlaceholderRowCount();
  const persistedDataState = useMemo<
    | undefined
    | {
        readonly data: readonly TData[];
        readonly totalRows?: number;
      }
  >(() => {
    return readPersistedDataStateFromSessionStorage<TData>({
      appId,
      persistenceKey,
    });
  }, [appId, persistenceKey]);

  const hasPersistedRows = (persistedDataState?.data.length ?? 0) > 0;
  const placeholderData = generatePlaceholderData<TData>({
    columns,
    rowCount: placeholderRowCount,
  });
  const effectiveData: TData[] = hasPersistedRows
    ? [...(persistedDataState?.data ?? [])]
    : placeholderData;
  const totalRows = hasPersistedRows
    ? (persistedDataState?.totalRows ?? effectiveData.length)
    : effectiveData.length;

  return (
    <Table<TData, SkeletonResponse<TData>>
      actions={actions}
      crud={crud}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.totalRows}
      isLoading
      response={{ data: effectiveData, totalRows }}
    />
  );
};
