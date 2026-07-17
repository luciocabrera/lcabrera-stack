import type {
  SkeletonResponse,
  TableSkeletonProps,
} from './TableSkeleton.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import { useGetTablePlaceholderRowCount } from '../contexts/TableConfig/meta/selectors';
import { Table } from '../Table.component';
import { generatePlaceholderData } from '../TableBody/utils';

export const TableSkeleton = <TData extends Record<string, unknown>>({
  actions,
}: TableSkeletonProps<TData>) => {
  const columns = useGetColumns<TData>();
  const placeholderRowCount = useGetTablePlaceholderRowCount();

  const placeholderData = generatePlaceholderData<TData>({
    columns,
    rowCount: placeholderRowCount,
  });

  return (
    <Table<TData, SkeletonResponse<TData>>
      actions={actions}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.totalRows}
      isLoading
      response={{ data: placeholderData, totalRows: placeholderData.length }}
    />
  );
};
