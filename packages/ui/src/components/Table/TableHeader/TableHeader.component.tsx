import * as stylex from '@stylexjs/stylex';

import { useGetPinnedColumnPartition } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '#ui/components/Table/contexts/TableData/data/selectors';
import { HEADER_ARIA_ROW_INDEX } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderBand } from '../TableHeaderBand';
import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';
import { hasHeaderBands, resolveHeaderBands } from './utils';

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

  const partitions = [leftPinnedCols, centerCols, rightPinnedCols];
  const isShowsBands = partitions.some((partition) =>
    hasHeaderBands(partition),
  );

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      {isShowsBands && (
        <TableRow aria-hidden='true' isHeader isStriped={false}>
          {partitions.flatMap((partition) =>
            resolveHeaderBands({ columns: partition }).map((band) => (
              <TableHeaderBand
                columns={band.columns}
                key={String(band.columns[0]?.key)}
                label={band.label}
              />
            )),
          )}
        </TableRow>
      )}
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
