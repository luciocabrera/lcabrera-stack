import type { SkeletonResponse } from './TableSkeleton.types.ts';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors/index.ts';
import { useGetTablePlaceholderRowCount } from '../contexts/TableConfig/meta/selectors/index.ts';
import { Table } from '../Table.component.tsx';
import { generatePlaceholderData } from '../TableBody/utils/index.ts';

export const TableSkeleton = () => {
  const columns = useGetColumns();
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
