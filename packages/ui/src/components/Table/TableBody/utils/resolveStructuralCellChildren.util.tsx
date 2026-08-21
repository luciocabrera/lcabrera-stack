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
  /**
   * Whether the row carries a structural marker field at all — see
   * `hasTableStructuralMarker`. Separate from the two narrowed values above
   * because they cannot distinguish a malformed marker from an absent one.
   */
  readonly hasStructuralMarker: boolean;
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
 * 3. **A row that claims to be chrome but did not narrow**, blanked whole. It
 *    is a malformed group or drill row, never a data row, and saying so here is
 *    what keeps a bad marker inside the branch that knows what to do with it.
 *    Falling through instead handed it to the detail-row path, where the
 *    actions column asked it for a primary key and `resolveCrudRowId` threw
 *    during render — emptying the whole table for one unnarrowable field
 *    (ADR-062).
 * 4. **A detail row's grouped-by columns, blanked.** The value is stated by the
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
  hasStructuralMarker,
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

  // Fails closed: the row said it was chrome and neither validator could read
  // it, so it is blanked rather than read as data.
  if (hasStructuralMarker) return EMPTY_CELL;

  return groupingKeys.includes(columnKey) ? EMPTY_CELL : undefined;
};
