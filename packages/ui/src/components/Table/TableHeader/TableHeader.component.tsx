import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '#ui/components/Table/contexts/TableData/data/selectors';
import { HEADER_ARIA_ROW_INDEX } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

/**
 * "Manage Column" opens the per-column settings drawer — filter and width — so
 * it is offered for a column that has both.
 *
 * Every painted column is now one of the consumer's own, including the group
 * keys (ADR-080), and a key keeps its filter and its width while grouped: the
 * hoist fixes where it sits, not what it is. So there is no column here whose
 * drawer would open with nothing in it to change.
 */
const hasHeaderSettings = (col: { isHeaderHidden?: boolean; key: unknown }) =>
  !col.isHeaderHidden;

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
