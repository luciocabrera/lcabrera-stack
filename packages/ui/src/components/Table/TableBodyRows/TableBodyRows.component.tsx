import {
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
  useGetPinnedColumnPartition,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { createRenderTableBodyCell } from '@repo/ui/components/Table/TableBody/utils/createRenderTableBodyCell.util';
import { renderTableBodyPinnedGroup } from '@repo/ui/components/Table/TableBody/utils/renderTableBodyPinnedGroup.util';
import { TableRow } from '@repo/ui/components/Table/TableRow';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';

export const TableBodyRows = <TData extends Record<string, unknown>>({
  endIndex,
  isLoadingState,
  startIndex,
}: TableBodyRowsProps) => {
  const data = useGetTableData<TData>();
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
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

        return (
          <TableRow key={rowIndex}>
            {renderTableBodyPinnedGroup({
              columns: leftPinnedCols,
              renderCell: renderBodyCell,
              row,
            })}
            {renderTableBodyPinnedGroup({
              columns: centerCols,
              renderCell: renderBodyCell,
              row,
            })}
            {renderTableBodyPinnedGroup({
              columns: rightPinnedCols,
              renderCell: renderBodyCell,
              row,
            })}
          </TableRow>
        );
      })}
    </>
  );
};
