import type { SkeletonResponse } from './TableSkeleton.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import { useGetTablePlaceholderRowCount } from '../contexts/TableConfig/meta/selectors';
import { Table } from '../Table.component';
import { generatePlaceholderData } from '../TableBody/utils';

export const TableSkeleton = () => {
  const columns = useGetColumns<Record<string, unknown>>();
  const placeholderRowCount = useGetTablePlaceholderRowCount();
  const effectiveData = generatePlaceholderData<Record<string, unknown>>({
    columns,
    rowCount: placeholderRowCount,
  });
  return (
    <Table<Record<string, unknown>, SkeletonResponse>
      dataSelector={(response) => response.data}
      isLoading
      response={{ data: effectiveData }}
    />
  );
};
