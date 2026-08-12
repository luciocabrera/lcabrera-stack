import * as stylex from '@stylexjs/stylex';

import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '#ui/components/Table/SpacerRow';
import { TableBodyRows } from '#ui/components/Table/TableBodyRows';
import { TableEmptyState } from '#ui/components/Table/TableEmptyState';
import { useVirtualization } from '#ui/hooks';

import type { TableBodyProps } from './TableBody.types';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
  useGetTableTotalLoadedRows,
} from '../contexts/TableData/data/selectors';
import { styles } from './TableBody.stylex';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  const totalLoadedRows = useGetTableTotalLoadedRows();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const rowHeight = useGetTableRowHeight();
  const overscan = useGetTableOverscan();

  const isLoadingState = isLoading || isLoadingMore;
  const isEmpty = totalLoadedRows === 0 && !isLoadingState;

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: totalLoadedRows,
    });

  // The empty body keeps `display: table-row-group`, so its implicit
  // `rowgroup` role survives and declaring one here would be the redundancy the
  // populated branch below only looks like.
  if (isEmpty)
    return (
      <tbody data-testid='table-body' {...stylex.props(styles.bodyEmpty)}>
        <TableEmptyState />
      </tbody>
    );

  return (
    // `role='rowgroup'` is declared because `styles.body` makes this element a
    // CSS grid, and a browser drops an element's implicit table role along with
    // its table `display` (ADR-062). Without it the accessibility tree reads
    // `grid > generic > row`, and a grid's rows must be owned by a rowgroup —
    // the same reason every row and cell below declares its own role.
    <tbody
      data-testid='table-body'
      role='rowgroup'
      {...stylex.props(styles.body(totalHeight))}
    >
      {offsetY > 0 && <SpacerRow height={offsetY} />}
      <TableBodyRows
        endIndex={endIndex}
        isLoadingState={isLoadingState}
        startIndex={startIndex}
      />
      {bottomSpacerHeight > 0 && <SpacerRow height={bottomSpacerHeight} />}
    </tbody>
  );
};
