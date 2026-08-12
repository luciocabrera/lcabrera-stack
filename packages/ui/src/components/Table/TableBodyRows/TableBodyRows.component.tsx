import {
  useGetColumns,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
  useGetPinnedColumnPartition,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { createRenderTableBodyCell } from '#ui/components/Table/TableBody/utils/createRenderTableBodyCell.util';
import { renderTableBodyPinnedGroup } from '#ui/components/Table/TableBody/utils/renderTableBodyPinnedGroup.util';
import { TableGroupHeaderRow } from '#ui/components/Table/TableGroupHeaderRow';
import { TableRow } from '#ui/components/Table/TableRow';
import { getTableGroupRowSummary } from '#ui/components/Table/utils';
import { resolveBodyAriaRowIndex } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';
import { resolveRowKey } from './utils/resolveRowKey.util';

/**
 * The rendered virtualization window.
 *
 * Which component a row gets is asked of the **row**, not of the grouping
 * configuration: a row carrying a group summary renders as a group header and
 * everything else renders its cells, so a grouped and an ungrouped row can sit
 * in one result. Both paths go through `TableRow`, so both paint at the store's
 * `rowHeight` and `TableBody`'s window arithmetic holds unchanged under
 * grouping.
 */
export const TableBodyRows = <TData extends Record<string, unknown>>({
  endIndex,
  isLoadingState,
  startIndex,
}: TableBodyRowsProps) => {
  const data = useGetTableData<TData>();
  const columns = useGetColumns<TData>();
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
        const rowKey = resolveRowKey({ columns, index: rowIndex, row });
        const ariaRowIndex = resolveBodyAriaRowIndex({ rowIndex });
        const groupSummary = getTableGroupRowSummary(row);

        if (groupSummary !== undefined) {
          return (
            <TableGroupHeaderRow
              aria-rowindex={ariaRowIndex}
              key={rowKey}
              summary={groupSummary}
            />
          );
        }

        return (
          <TableRow aria-rowindex={ariaRowIndex} key={rowKey}>
            {renderTableBodyPinnedGroup({
              columns: leftPinnedCols,
              renderCell: renderBodyCell,
              row,
              rowIndex,
              rowKey,
            })}
            {renderTableBodyPinnedGroup({
              columns: centerCols,
              renderCell: renderBodyCell,
              row,
              rowIndex,
              rowKey,
            })}
            {renderTableBodyPinnedGroup({
              columns: rightPinnedCols,
              renderCell: renderBodyCell,
              row,
              rowIndex,
              rowKey,
            })}
          </TableRow>
        );
      })}
    </>
  );
};
