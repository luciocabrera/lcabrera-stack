import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '#ui/components/Table/contexts/TableData/data/selectors';
import { isTableGroupHierarchyColumn } from '#ui/components/Table/utils/isTableGroupHierarchyColumn.util';
import { HEADER_ARIA_ROW_INDEX } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

/**
 * "Manage Column" opens the per-column settings drawer — filter and width — so
 * it is offered for a column that has both. The hierarchy column is the grid's
 * own (ADR-065): it is not filterable, its width is not the user's, and its
 * header exists to name the group keys, so the entry would open a drawer with
 * nothing in it to change.
 */
const hasHeaderSettings = (col: { isHeaderHidden?: boolean; key: unknown }) =>
  !col.isHeaderHidden && !isTableGroupHierarchyColumn(col.key);

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  const { centerCols, leftPinnedCols, rightPinnedCols } =
    useGetPinnedColumnPartition();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isLoadingState = isLoading || isLoadingMore;

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow aria-rowindex={HEADER_ARIA_ROW_INDEX} isHeader>
        {leftPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={hasHeaderSettings(col)}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
        {centerCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={hasHeaderSettings(col)}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
        {rightPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={hasHeaderSettings(col)}
            isLoadingState={isLoadingState}
            key={col.key}
          />
        ))}
      </TableRow>
    </thead>
  );
};
