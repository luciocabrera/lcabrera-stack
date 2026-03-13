import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnPinning,
  useGetColumnSizing,
  useGetEffectiveColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableOverscan,
  useGetTableRowHeight,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { SpacerRow } from '@/components/Table/SpacerRow';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { TableBodyCell } from '@/components/Table/TableBodyCell';
import { TableRow } from '@/components/Table/TableRow';
import { getPinnedColumnOffsets } from '@/components/Table/utils';
import { useVirtualization } from '@/hooks';
import { useRenderTracker } from '@/utils/performance';

import type { TableBodyProps } from './TableBody.types';

import { useGetTableData } from '../contexts/TableData/data/selectors';
import { styles } from './TableBody.stylex';

export const TableBody = ({ tableContainerRef }: TableBodyProps) => {
  useRenderTracker({ componentName: 'TableBody' });

  const columnPinning = useGetColumnPinning();
  const columnSizing = useGetColumnSizing();
  const effectiveColumns = useGetEffectiveColumns();
  const data = useGetTableData();

  const pinnedOffsets = getPinnedColumnOffsets({
    columnPinning,
    columnSizing,
    effectiveColumns,
  });
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

              if (col.render) {
                return (
                  <TableBodyCell
                    key={col.key}
                    label={''}
                    minWidth={effectiveMinWidth}
                    pinInfo={pinnedOffsets[col.key]}
                    width={finalWidth}
                  >
                    {col.render(rowData)}
                  </TableBodyCell>
                );
              }

              return (
                <TableBodyCell
                  dataType={col.dataType}
                  format={col.format}
                  key={col.key}
                  label={col.label}
                  minWidth={effectiveMinWidth}
                  pinInfo={pinnedOffsets[col.key]}
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
