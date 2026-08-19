import type {
  TableDrillRowMarker,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { resolveDrillCellChildren } from './resolveDrillCellChildren.util';
import {
  EMPTY_CELL,
  resolveGroupCellChildren,
} from './resolveGroupCellChildren.util';

type ResolveStructuralCellChildrenArgs = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly drillRow: TableDrillRowMarker | undefined;
  readonly groupingKeys: readonly string[];
  readonly groupSummary: TableGroupRowSummary | undefined;
};

/**
 * What a cell holds when its content comes from the **grid** rather than from
 * the row's own data — or `undefined` when it does not, which is the ordinary
 * data cell every other branch of the descriptor handles.
 *
 * Three cases, in an order that is load-bearing:
 *
 * 1. **Drill chrome first.** A drill row carries neither a summary nor data, so
 *    either of the two below would read it as a detail row and blank the one
 *    column its chrome goes in — leaving a row at full height saying nothing.
 * 2. **A group row's own cells**, asked of the row and never of the grouping
 *    configuration, so a group row and a detail row can arrive in one result.
 * 3. **A detail row's grouped-by columns, blanked.** The value is stated by the
 *    group row above it, in the same column, and repeating it down a column
 *    whose header already says it is a column of one word (ADR-065, ADR-080).
 *
 * `EMPTY_CELL` rather than `undefined` for that last case: they are not the same
 * DOM. `TableBodyCell` reads `children !== undefined` as "content was supplied",
 * so `undefined` wraps nothing in a `<span title="">` — an element and an
 * attribute in the accessibility tree for a cell that holds nothing. It is also
 * why this function can use `undefined` as its own "not structural" answer.
 */
export const resolveStructuralCellChildren = ({
  carriedGroupKeys,
  columnKey,
  disclosure,
  drillRow,
  groupingKeys,
  groupSummary,
}: ResolveStructuralCellChildrenArgs) => {
  if (drillRow !== undefined)
    return resolveDrillCellChildren({
      columnKey,
      groupingKeys,
      marker: drillRow,
    });

  if (groupSummary !== undefined)
    return resolveGroupCellChildren({
      carriedGroupKeys,
      columnKey,
      disclosure,
      groupingKeys,
      summary: groupSummary,
    });

  return groupingKeys.includes(columnKey) ? EMPTY_CELL : undefined;
};
