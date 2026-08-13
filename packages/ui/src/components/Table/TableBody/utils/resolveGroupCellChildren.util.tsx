import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { ACTIONS_COLUMN_KEY } from '#ui/components/Table/Table.constants';
import { TableGroupAggregate } from '#ui/components/Table/TableGroupAggregate';
import { TableGroupLabel } from '#ui/components/Table/TableGroupLabel';
import { isTableGroupHierarchyColumn } from '#ui/components/Table/utils/isTableGroupHierarchyColumn.util';

type ResolveGroupCellChildrenArgs = {
  readonly columnKey: string;
  readonly summary: TableGroupRowSummary;
};

/**
 * What one cell of a group row holds: the hierarchy label, an aggregate, or
 * nothing.
 *
 * The three cases in one place, because the second is the general rule and the
 * other two are the only exceptions to it — every column carries that group's
 * selected aggregate under its own header, the hierarchy column carries the
 * label instead, and the actions column carries neither.
 *
 * The **actions column renders empty**, not a dash. A dash says "no aggregate
 * was selected on this column", which is a statement about a column that could
 * have carried one; the actions column cannot, and acts on a row a group is
 * not.
 *
 * **`EMPTY_CELL` is an empty fragment on purpose, and Biome's
 * `noUselessFragments` reports it at info severity — the finding is wrong
 * here.** `TableBodyCell` decides whether a caller supplied content with
 * `children !== undefined`, so the two nullish spellings mean opposite things:
 * a fragment is "custom content, deliberately empty" and `undefined` is "no
 * custom content", which sends the cell down the default branch and renders
 * the row's own value into a group row. `buildTableBodyCellDescriptor.util.tsx`
 * carries the same value for a detail row's blanked columns, for the same
 * reason. Replacing either with `undefined` is a behaviour change, not a
 * tidy-up; `TableBodyRows.test.tsx` fails if it is made.
 */

/**
 * A cell that holds nothing, said in the one spelling the descriptor reads as
 * "content was supplied". See the note above before changing it.
 */
export const EMPTY_CELL = <></>;
export const resolveGroupCellChildren = ({
  columnKey,
  summary,
}: ResolveGroupCellChildrenArgs) => {
  if (isTableGroupHierarchyColumn(columnKey)) {
    return <TableGroupLabel summary={summary} />;
  }

  if (columnKey === ACTIONS_COLUMN_KEY) {
    return EMPTY_CELL;
  }

  return <TableGroupAggregate columnKey={columnKey} summary={summary} />;
};
