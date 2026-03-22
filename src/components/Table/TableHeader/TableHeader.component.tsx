import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnPinning,
  useGetColumnSizing,
  useGetEffectiveColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';

import {
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from '@/components/Table/utils';

import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  useRenderTracker({ componentName: 'TableHeader' });

  const effectiveColumns = useGetEffectiveColumns();
  const columnPinning = useGetColumnPinning();
  const columnSizing = useGetColumnSizing();

  const pinnedOffsets = getPinnedColumnOffsets({
    columnPinning,
    columnSizing,
    effectiveColumns,
  });

  const { centerCols, leftPinnedCols, rightPinnedCols } = splitColumnsByPinning(
    { columnPinning, effectiveColumns },
  );

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {leftPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            key={col.key}
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
        {centerCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            key={col.key}
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
        {rightPinnedCols.map((col) => (
          <TableHeaderCell
            columnKey={col.key}
            hasSettings={!col.isHeaderHidden}
            key={col.key}
            pinInfo={pinnedOffsets[col.key]}
          />
        ))}
      </TableRow>
    </thead>
  );
};
