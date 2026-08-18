import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { ACTIONS_COLUMN_KEY } from '#ui/components/Table/Table.constants';
import { TableGroupAggregate } from '#ui/components/Table/TableGroupAggregate';
import { TableGroupKeyCell } from '#ui/components/Table/TableGroupKeyCell';

type ResolveGroupCellChildrenArgs = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

/**
 * What one cell of a group row holds: its own key's value, an aggregate, or
 * nothing.
 *
 * The three cases in one place, because the second is the general rule and the
 * other two are the only exceptions to it — every column carries that group's
 * selected aggregate under its own header, a **group-key** column carries that
 * key's value instead (ADR-080), and the actions column carries neither.
 *
 * **The key is tested before the aggregate, and that ordering is the rule.**
 * Nothing forbids a request naming one column as both a key and an aggregate —
 * `assertGroupAggregates` checks each aggregate against the catalogue and never
 * cross-checks the key list, and the grouping configuration is URL state, so a
 * request can always ask for the combination however the picker is built. Under
 * one column per key that column cannot render both, so the key wins here, in
 * the derivation, rather than only in the menu that offers it (ADR-080).
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
  carriedGroupKeys,
  columnKey,
  disclosure,
  groupingKeys,
  summary,
}: ResolveGroupCellChildrenArgs) => {
  if (groupingKeys.includes(columnKey)) {
    return (
      <TableGroupKeyCell
        columnKey={columnKey}
        disclosure={disclosure}
        groupingKeys={groupingKeys}
        isCarried={carriedGroupKeys.has(columnKey)}
        summary={summary}
      />
    );
  }

  if (columnKey === ACTIONS_COLUMN_KEY) {
    return EMPTY_CELL;
  }

  return <TableGroupAggregate columnKey={columnKey} summary={summary} />;
};
