import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@/components/Table/SpacerRow';
import { TableBodyRows } from '@/components/Table/TableBodyRows';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';
import * as stylex from '@stylexjs/stylex';

import type { TableBodyProps } from './TableBody.types';

import { styles } from './TableBody.stylex';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
  useGetTableTotalLoadedRows,
} from '../contexts/TableData/data/selectors';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

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
