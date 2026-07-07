import {
  useGetColumnGroups,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { createRenderTableBodyCell } from '@repo/ui/components/Table/TableBody/utils/createRenderTableBodyCell.util';
import { renderTableBodyColumnGroup } from '@repo/ui/components/Table/TableBody/utils/renderTableBodyColumnGroup.util';
import { TableRow } from '@repo/ui/components/Table/TableRow';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';

export const TableBodyRows = <TData extends Record<string, unknown>>({
  endIndex,
  isLoadingState,
  startIndex,
}: TableBodyRowsProps) => {
  const data = useGetTableData<TData>();
  const { centerCols, leftPinnedCols, rightPinnedCols } = useGetColumnGroups();
  const columnSizing = useGetColumnSizing<TData>();
  const pinnedOffsets = useGetPinnedColumnOffsets();

  const visibleRows = data.slice(startIndex, endIndex);

  const renderBodyCell = createRenderTableBodyCell({
    columnSizing,
    isLoadingState,
    pinnedOffsets,
  });

  return (
    <>
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const rowData = row as Record<string, unknown>;

        return (
          <TableRow key={rowIndex}>
            {renderTableBodyColumnGroup({
              columns: leftPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: centerCols,
              renderCell: renderBodyCell,
              rowData,
            })}
            {renderTableBodyColumnGroup({
              columns: rightPinnedCols,
              renderCell: renderBodyCell,
              rowData,
            })}
          </TableRow>
        );
      })}
    </>
  );
};
