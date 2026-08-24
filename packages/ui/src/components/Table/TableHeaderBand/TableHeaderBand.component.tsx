import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import type { TableHeaderBandProps } from './TableHeaderBand.types';

import { tableHeaderBandStyles } from './TableHeaderBand.stylex';
import { resolveBandPinnedStyle } from './utils';

/**
 * Spans by width, not `colSpan` — the row is `display: flex` (ADR-062).
 * The parent row is `aria-hidden`; do not add `role='presentation'`.
 */
export const TableHeaderBand = <TData extends Record<string, unknown>>({
  columns,
  label,
}: TableHeaderBandProps<TData>) => {
  const columnSizing = useGetColumnSizing<TData>();
  const pinnedOffsets = useGetPinnedColumnOffsets();

  const width = columns.reduce(
    (total, column) =>
      total +
      (columnSizing[column.key] ?? column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH),
    0,
  );

  const pinnedStylex = resolveBandPinnedStyle({
    leading: pinnedOffsets[columns[0]?.key as 'actions'],
    trailing: pinnedOffsets[columns.at(-1)?.key as 'actions'],
  });

  return (
    <th
      data-testid='table-header-band'
      {...stylex.props(
        tableHeaderBandStyles.base(width),
        label !== undefined && tableHeaderBandStyles.labelled,
        pinnedStylex,
      )}
    >
      {label !== undefined && (
        <span {...stylex.props(tableHeaderBandStyles.label)}>{label}</span>
      )}
    </th>
  );
};
