import {
  useGetColumns,
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
  useGetPinnedColumnPartition,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useTableGroupTree } from '#ui/components/Table/hooks';
import { createRenderTableBodyCell } from '#ui/components/Table/TableBody/utils/createRenderTableBodyCell.util';
import { renderTableBodyPinnedGroup } from '#ui/components/Table/TableBody/utils/renderTableBodyPinnedGroup.util';
import { TableRow } from '#ui/components/Table/TableRow';
import { getTableGroupRowSummary } from '#ui/components/Table/utils';
import { resolveBodyAriaRowIndex } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { resolveGroupRowStyle } from './utils/resolveGroupRowStyle.util';
import { resolveRowKey } from './utils/resolveRowKey.util';
import { resolveTreeRowAriaProps } from './utils/resolveTreeRowAriaProps.util';

/**
 * The rendered virtualization window.
 *
 * **One rendering path, whatever a row is** (ADR-065). A row carrying a group
 * summary and a detail row produce the same `TableRow` over the same columns in
 * the same order; only what each cell holds differs, and that is
 * `buildTableBodyCellDescriptor`'s decision. The spanning banner a group row
 * used to be, and the branch that chose it, are both gone — which is what makes
 * a group row's cells ordinary focus targets with no special case in the focus
 * model (ADR-062).
 *
 * What a row *is* is still asked of the **row**, not of the grouping
 * configuration, so a group row and a detail row can arrive in the same result.
 * The configuration is consulted for one thing only: which data columns a
 * *detail* row blanks, because its group row already states them.
 *
 * It loops over the rows a collapse leaves standing, and `rowIndex` counts
 * those. That index is the grid's index space in every other sense too — the
 * focus store's `rowIndex`, `aria-rowindex`, and the number `TableBody` sizes
 * `<tbody>` from all come off the same array (ADR-067) — so a hidden row cannot
 * be numbered, focused, or paid for in height. Every row goes through
 * `TableRow`, so every row paints at the store's `rowHeight` whatever kind it
 * is, and the tree attributes ride on that same element rather than on a shape
 * only one kind of row has.
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
  const groupingKeys = useGetTableGroupingKeys();

  const visibleRows = rows.slice(startIndex, endIndex);

  const renderBodyCell = createRenderTableBodyCell({
    columnSizing,
    groupingKeys,
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
        const isGroupRow = groupSummary !== undefined;
        const cellArgs = {
          disclosure: rowMeta?.[rowIndex],
          groupSummary,
          renderCell: renderBodyCell,
          row,
          rowIndex,
          rowKey,
        };

        return (
          <TableRow
            {...treeProps}
            aria-rowindex={ariaRowIndex}
            customStylex={resolveGroupRowStyle(groupSummary)}
            data-testid={isGroupRow ? 'table-group-header-row' : undefined}
            isStriped={!isGroupRow}
            key={rowKey}
          >
            {renderTableBodyPinnedGroup({
              ...cellArgs,
              columns: leftPinnedCols,
            })}
            {renderTableBodyPinnedGroup({ ...cellArgs, columns: centerCols })}
            {renderTableBodyPinnedGroup({
              ...cellArgs,
              columns: rightPinnedCols,
            })}
          </TableRow>
        );
      })}
    </>
  );
};
