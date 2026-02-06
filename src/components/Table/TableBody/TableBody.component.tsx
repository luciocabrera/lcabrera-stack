import * as stylex from '@stylexjs/stylex';

import { SpacerRow } from '@/components/Table/SpacerRow';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { TableBodyCell } from '@/components/Table/TableBodyCell';
import {
  useGetColumnSizing,
  useGetEffectiveColumns,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/TableContext/hooks/store/meta/selectors';
import { TableRow } from '@/components/Table/TableRow';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useGetTableData } from '../TableContext/hooks/store/data/selectors';
import { styles } from './TableBody.stylex';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

  const columnSizing = useGetColumnSizing();
  const effectiveColumns = useGetEffectiveColumns();
  const data = useGetTableData();
  const rowHeight = useGetTableRowHeight();
  const overscan = useGetTableOverscan();

  const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
    useVirtualization({
      containerRef: tableContainerRef,
      itemHeight: rowHeight,
      overscan,
      totalItems: data.length,
    });

  const visibleRows = data.slice(startIndex, endIndex);
  const totalRows = data.length;

  return (
    <tbody data-testid='table-body' {...stylex.props(styles.body(totalHeight))}>
      {offsetY > 0 && (
        <SpacerRow colSpan={effectiveColumns.length} height={offsetY} />
      )}
      {visibleRows.map((row, index) => {
        const rowIndex = startIndex + index;
        const rowData = row as Record<string, unknown>;
        return (
          <TableRow key={rowIndex}>
            {effectiveColumns.map((col) => {
              const effectiveMinWidth =
                col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
              const finalWidth = columnSizing[col.key] ?? effectiveMinWidth;

              return (
                <TableBodyCell
                  dataType={col.dataType}
                  format={col.format}
                  key={col.key}
                  label={col.label}
                  minWidth={effectiveMinWidth}
                  value={col.key in rowData ? rowData[col.key] : ''}
                  width={finalWidth}
                />
              );
            })}
          </TableRow>
        );
      })}
      {totalRows > 0 && bottomSpacerHeight > 0 && (
        <SpacerRow
          colSpan={effectiveColumns.length}
          height={bottomSpacerHeight}
        />
      )}
    </tbody>
  );
};
