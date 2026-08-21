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
 * One cell of the header's upper row: the name of the group its columns belong
 * to, spanning them.
 *
 * **It spans by width, not by `colSpan`.** `TableRow` and `TableHeaderCell` are
 * `display: flex` (ADR-062), and a flex container ignores table spanning
 * outright — a `colSpan` here would lay out as an ordinary flex item one column
 * wide. So the span is the sum of its members' widths, resolved from the same
 * sizing state the cells below resolve theirs from, which is what keeps the two
 * rows aligned while a column is being resized.
 *
 * **The row it sits in is `aria-hidden`, which is the whole of how this cell
 * stays out of the accessibility tree** — `aria-hidden` removes an element and
 * its descendants, so the band needs no role of its own. Stating
 * `role='presentation'` here as well would be redundant *and* refused: it
 * converts an element with an implicit `columnheader` role into a
 * non-interactive one, which `a11y/noInteractiveElementToNoninteractiveRole`
 * reports.
 *
 * **The context the band carries is not lost.** This band is decorative: the grid's focus model addresses cells by
 * column key and the row below holds every real `columnheader`, so a second
 * announced header row would add a row to the sequence `aria-rowindex` counts
 * through and give assistive technology two cells per column to walk. The group
 * name instead reaches the accessibility tree through each measure column's own
 * accessible name — `Total Amount Average` rather than a bare `Average` — so
 * the information is in the tree exactly once, on the cell that is addressable.
 *
 * **A band with no label still renders**, holding the space above a column that
 * belongs to no group. Flex lays this row out from its own children, so a
 * missing cell does not leave a gap — it shifts every band after it.
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
