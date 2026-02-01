import { Table } from '../Table.component';
import { generatePlaceholderData } from '../TableBody/utils';
import { useGetColumns } from '../TableContext/hooks/store/columns/selectors';
import { useGetTablePlaceholderRowCount } from '../TableContext/hooks/store/meta/selectors';

export const TableSkeleton = () => {
  const columns = useGetColumns<Record<string, unknown>>();
  const placeholderRowCount = useGetTablePlaceholderRowCount();
  const effectiveData = generatePlaceholderData<Record<string, unknown>>({
    columns,
    rowCount: placeholderRowCount,
  });
  return (
    <Table<Record<string, unknown>, unknown>
      response={{ data: effectiveData }}
    />
  );
};
