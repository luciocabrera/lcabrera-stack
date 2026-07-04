import * as stylex from '@stylexjs/stylex';

import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@repo/ui/components/Table/SpacerRow';
import { TableBodyRows } from '@repo/ui/components/Table/TableBodyRows';
import { useVirtualization } from '@repo/ui/hooks';

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

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: totalLoadedRows,
    });

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
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
