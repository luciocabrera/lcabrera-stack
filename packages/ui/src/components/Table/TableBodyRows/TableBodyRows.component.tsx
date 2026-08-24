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
import { hasTableStructuralMarker } from '#ui/components/Table/utils/hasTableStructuralMarker.util';
import { resolveCarriedGroupKeys } from '#ui/components/Table/utils/resolveCarriedGroupKeys.util';
import { resolveDeclaredGroupingKeys } from '#ui/components/Table/utils/resolveDeclaredGroupingKeys.util';
import { resolveBodyAriaRowIndex } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableBodyRowsProps } from './TableBodyRows.types';

import { resolveGroupRowStyle } from './utils/resolveGroupRowStyle.util';
import { resolveRowKey } from './utils/resolveRowKey.util';
import { resolveTreeRowAriaProps } from './utils/resolveTreeRowAriaProps.util';

/**
 * The rendered virtualization window.
 * **One rendering path, whatever a row is** (ADR-065).
 * The spanning banner a group row used to be, and the branch that chose it, are both gone
 * — which is what makes a group row's cells ordinary focus targets with no special case in
 * the focus model (ADR-062).
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
  const appliedGroupingKeys = useGetTableGroupingKeys();

  // The same skip `withGroupedColumnLayout` applies to the hoist. A key naming
  // no declared column is painted nowhere, so treating it as a key here would
  // look for the grand total in a column that does not exist.
  const groupingKeys = resolveDeclaredGroupingKeys<TData>({
    columns,
    groupingKeys: appliedGroupingKeys,
  });

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
        // Read off `rows`, the loaded array, never off `visibleRows` — a level
        // carried from a row scrolled out of the window would be stated
        // nowhere, so the window's first row refills (ADR-080).
        const carriedGroupKeys = resolveCarriedGroupKeys({
          isWindowFirst: index === 0,
          previousRow: rows[rowIndex - 1],
          summary: groupSummary,
        });
        const cellArgs = {
          carriedGroupKeys,
          disclosure: rowMeta?.[rowIndex],
          groupSummary,
          // Asked of the row, not of the two values above: neither can tell a
          // malformed marker from an absent one, and that gap is what let a
          // group row reach the detail-row path (ADR-062).
          hasStructuralMarker: hasTableStructuralMarker(row),
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
