import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { ACTIONS_COLUMN_KEY } from '#ui/components/Table/Table.constants';
import { TableGroupAggregate } from '#ui/components/Table/TableGroupAggregate';
import { TableGroupLabel } from '#ui/components/Table/TableGroupLabel';
import { isTableGroupHierarchyColumn } from '#ui/components/Table/utils/isTableGroupHierarchyColumn.util';

type ResolveGroupCellChildrenArgs = {
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
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
 * `noUselessFragments` reports it at info severity.** `TableBodyCell` decides
 * whether a caller supplied content with `children !== undefined`, so the two
 * spellings do not produce the same DOM: a fragment leaves the `<td>` genuinely
 * empty, while `undefined` takes the default branch and wraps *nothing* in
 * `<span title="" class="…">` — an element and an attribute in the
 * accessibility tree for a cell that holds nothing.
 *
 * That is the whole of the difference, and it is worth being exact: the
 * `custom` descriptor never forwards `value` or `dataType`, so `undefined`
 * would **not** render the row's own value. The choice is between an empty cell
 * and an empty span, and the empty cell is the honest one.
 * `buildTableBodyCellDescriptor.util.tsx` uses the same constant for a detail
 * row's blanked columns. `Table.groupedGridSemantics.test.tsx` pins the
 * difference.
 */

/**
 * A cell that holds nothing, said in the one spelling the descriptor reads as
 * "content was supplied". See the note above before changing it.
 */
export const EMPTY_CELL = <></>;
export const resolveGroupCellChildren = ({
  columnKey,
  disclosure,
  summary,
}: ResolveGroupCellChildrenArgs) => {
  if (isTableGroupHierarchyColumn(columnKey)) {
    return <TableGroupLabel disclosure={disclosure} summary={summary} />;
  }

  if (columnKey === ACTIONS_COLUMN_KEY) {
    return EMPTY_CELL;
  }

  return <TableGroupAggregate columnKey={columnKey} summary={summary} />;
};
