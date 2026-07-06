import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@repo/ui/components/Table/SpacerRow';
import { TableBodyRows } from '@repo/ui/components/Table/TableBodyRows';
import { TableEmptyState } from '@repo/ui/components/Table/TableEmptyState';
import { useVirtualization } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';

import type { TableBodyProps } from './TableBody.types';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
  useGetTableTotalLoadedRows,
} from '../contexts/TableData/data/selectors';
import { styles } from './TableBody.stylex';

export const TableBody = <TData extends Record<string, unknown>>({
  crud,
  emptyState,
  tableContainerRef,
  titleSingular,
}: TableBodyProps<TData>) => {
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

  if (isEmpty)
    return (
      <tbody data-testid='table-body' {...stylex.props(styles.bodyEmpty)}>
        <TableEmptyState
          message={emptyState?.message}
          title={emptyState?.title}
        />
      </tbody>
    );

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {offsetY > 0 && <SpacerRow height={offsetY} />}
      <TableBodyRows<TData>
        crud={crud}
        endIndex={endIndex}
        isLoadingState={isLoadingState}
        startIndex={startIndex}
        titleSingular={titleSingular}
      />
      {bottomSpacerHeight > 0 && <SpacerRow height={bottomSpacerHeight} />}
    </tbody>
  );
};
