import * as stylex from '@stylexjs/stylex';

import { useVirtualization } from '@/hooks';

import type { TableBodyProps } from './TableBody.types';

import { LoadingMoreRow } from '../LoadingMoreRow';
import { SpacerRow } from '../SpacerRow';
import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.types';
import { TableBodyCell } from '../TableBodyCell';
import {
  useColumnSizing,
  useTableLoadingMore,
  useTotalRows,
} from '../TableContext/hooks';
import { TableRow } from '../TableRow';
import { styles } from './TableBody.stylex';
import { generatePlaceholderData } from './utils';

const DEFAULT_PLACEHOLDER_ROW_COUNT = 30;

export const TableBody = <TData extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  locale,
  overscan,
  placeholderRowCount = DEFAULT_PLACEHOLDER_ROW_COUNT,
  rowHeight = 32,
  tableContainerRef,
}: TableBodyProps<TData>) => {
  const [columnSizing] = useColumnSizing<TData>();
  const [isLoadingMore] = useTableLoadingMore();
  const [totalCount] = useTotalRows();

  // Use placeholder data when loading with no data
  const effectiveData =
    isLoading && data.length === 0
      ? generatePlaceholderData<TData>({
          columns,
          rowCount: placeholderRowCount,
        })
      : data;

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: effectiveData.length,
    });

  const visibleRows = effectiveData.slice(startIndex, endIndex);
  const totalRows = effectiveData.length;

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {/* Top spacer row */}
      {offsetY > 0 && <SpacerRow colSpan={columns.length} height={offsetY} />}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        return (
          <TableRow key={rowIndex}>
            {columns.map((col) => {
              const finalWidth =
                columnSizing[col.key] ??
                col.minWidth ??
                DEFAULT_MIN_COLUMN_WIDTH;

              return (
                <TableBodyCell
                  dataType={col.dataType}
                  format={col.format}
                  isLoading={isLoading}
                  key={col.key}
                  label={col.label}
                  locale={locale}
                  minWidth={col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH}
                  value={col.key in row ? row[col.key] : ''}
                  width={finalWidth}
                />
              );
            })}
          </TableRow>
        );
      })}
      {/* Bottom spacer row */}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow colSpan={columns.length} height={bottomSpacerHeight} />
      )}
      {/* Loading more indicator */}
      {isLoadingMore && (
        <LoadingMoreRow
          colSpan={columns.length}
          currentCount={data.length}
          totalCount={totalCount}
        />
      )}
    </tbody>
  );
};
