import {
  useGetColumns,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
  useGetPinnedColumnPartition,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useTableGroupTree } from '#ui/components/Table/hooks';
import { createRenderTableBodyCell } from '#ui/components/Table/TableBody/utils/createRenderTableBodyCell.util';
import { renderTableBodyPinnedGroup } from '#ui/components/Table/TableBody/utils/renderTableBodyPinnedGroup.util';
import { TableGroupHeaderRow } from '#ui/components/Table/TableGroupHeaderRow';
import { TableRow } from '#ui/components/Table/TableRow';
import { getTableGroupRowSummary } from '#ui/components/Table/utils';
import { resolveBodyAriaRowIndex } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { resolveRowKey } from './utils/resolveRowKey.util';
import { resolveTreeRowAriaProps } from './utils/resolveTreeRowAriaProps.util';

/**
 * The rendered virtualization window.
 *
 * Which component a row gets is asked of the **row**, not of the grouping
 * configuration: a row carrying a group summary renders as a group header and
 * everything else renders its cells, so a grouped and an ungrouped row can sit
 * in one result. Both paths go through `TableRow`, so both paint at the store's
 * `rowHeight` and `TableBody`'s window arithmetic holds unchanged under
 * grouping.
 *
 * It loops over the rows a collapse leaves standing, and `rowIndex` counts
 * those. That index is the grid's index space in every other sense too — the
 * focus store's `rowIndex`, `aria-rowindex`, and the number `TableBody` sizes
 * `<tbody>` from all come off the same array (ADR-067) — so a hidden row cannot
 * be numbered, focused, or paid for in height.
 */
export const TableBodyRows = <TData extends Record<string, unknown>>({
  endIndex,
  isLoadingState,
  startIndex,
}: TableBodyRowsProps) => {
  const { rowMeta, rows } = useTableGroupTree<TData>();
  const columns = useGetColumns<TData>();
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const columnSizing = useGetColumnSizing<TData>();
  const pinnedOffsets = useGetPinnedColumnOffsets();

  const visibleRows = rows.slice(startIndex, endIndex);

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
        const treeProps = resolveTreeRowAriaProps(rowMeta?.[rowIndex]);
        const groupSummary = getTableGroupRowSummary(row);

        if (groupSummary !== undefined) {
          return (
            <TableGroupHeaderRow
              {...treeProps}
              aria-rowindex={ariaRowIndex}
              key={rowKey}
              summary={groupSummary}
            />
          );
        }

        return (
          <TableRow {...treeProps} aria-rowindex={ariaRowIndex} key={rowKey}>
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
