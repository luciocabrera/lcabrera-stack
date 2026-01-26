import * as stylex from '@stylexjs/stylex';

import { SpacerRow } from '@/components/Table/SpacerRow';
import {
  DEFAULT_MIN_COLUMN_WIDTH,
  DEFAULT_PLACEHOLDER_ROW_COUNT,
  DEFAULT_ROW_HEIGHT,
} from '@/components/Table/Table.constants';
import { TableBodyCell } from '@/components/Table/TableBodyCell';
import {
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
} from '@/components/Table/TableContext/hooks';
import { TableRow } from '@/components/Table/TableRow';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useColumns } from '../TableContext/hooks/selectors.hooks';
import { styles } from './TableBody.stylex';
import { generatePlaceholderData } from './utils';

export const TableBody = <TData extends Record<string, unknown>>({
  data,
  isLoading = false,
  locale,
  overscan,
  placeholderRowCount = DEFAULT_PLACEHOLDER_ROW_COUNT,
  rowHeight = DEFAULT_ROW_HEIGHT,
  tableContainerRef,
}: TableBodyProps<TData>) => {
  useRenderTracker('TableBody');

  const [columns] = useColumns<TData>();
  const [columnSizing] = useColumnSizing<TData>();
  const [columnOrder] = useColumnOrder<TData>();
  const [columnVisibility] = useColumnVisibility<TData>();

  // Filter visible columns
  const visibleColumns = columns.filter(
    (col) => !columnVisibility.has(col.key),
  );

  // Apply column order
  const orderedColumns =
    columnOrder.length > 0
      ? [
          ...columnOrder
            .map((key) => visibleColumns.find((col) => col.key === key))
            .filter((col): col is NonNullable<typeof col> => col !== undefined),
          ...visibleColumns.filter((col) => !columnOrder.includes(col.key)),
        ]
      : visibleColumns;

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
      {offsetY > 0 && (
        <SpacerRow colSpan={orderedColumns.length} height={offsetY} />
      )}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        return (
          <TableRow key={rowIndex}>
            {orderedColumns.map((col) => {
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
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow
          colSpan={orderedColumns.length}
          height={bottomSpacerHeight}
        />
      )}
    </tbody>
  );
};
