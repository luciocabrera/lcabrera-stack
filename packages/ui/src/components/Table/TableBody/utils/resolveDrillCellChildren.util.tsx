import type { TableDrillRowMarker } from '#ui/components/Table/Table.types';

import { TableDrillRowCell } from '#ui/components/Table/TableDrillRowCell';

import { EMPTY_CELL } from './resolveGroupCellChildren.util';

type ResolveDrillCellChildrenArgs = {
  readonly columnKey: string;
  readonly groupingKeys: readonly string[];
  readonly marker: TableDrillRowMarker;
};

/**
 * What one cell of a grid-created drill row holds: the chrome, or nothing.
 *
 * **All of it goes in the first group-key column, and the rest are empty.** The
 * key columns are hoisted to the head of the order (ADR-080), so the first of
 * them is the leftmost cell of the grid — where a reader already looks for what
 * a row is about, and directly under the group heading these rows belong to.
 *
 * Nothing spans. A `colSpan` would give this row a different `gridcell` count
 * from every other row, which is what `role="grid"` forbids and what the focus
 * model's column addressing assumes (ADR-062, ADR-065). One filled cell and a
 * row of empty ones costs nothing and keeps the grid rectangular.
 *
 * With no group keys there is no column to fill, so every cell is empty. That
 * cannot arise from a drill — `isDrillableGroupRow` requires a complete path
 * over a non-empty key list — but it is the honest answer rather than a guess
 * at some other column.
 */
export const resolveDrillCellChildren = ({
  columnKey,
  groupingKeys,
  marker,
}: ResolveDrillCellChildrenArgs) =>
  groupingKeys[0] === columnKey ? (
    <TableDrillRowCell marker={marker} />
  ) : (
    EMPTY_CELL
  );
