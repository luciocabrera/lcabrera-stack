import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import {
  EMPTY_CELL,
  resolveGroupCellChildren,
} from './resolveGroupCellChildren.util';

type ResolveStructuralCellChildrenArgs = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly groupingKeys: readonly string[];
  readonly groupSummary: TableGroupRowSummary | undefined;
  /**
   * Separate from the narrowed summary above because that cannot distinguish a malformed
   * marker from an absent one.
   */
  readonly hasStructuralMarker: boolean;
};

/**
 * Three cases, in an order that is load-bearing: 1.
 * **A group row's own cells**, asked of the row and never of the grouping configuration,
 * so a group row and a detail row can arrive in one result.
 * It is a malformed group row, never a data row, and saying so here is what keeps a bad
 * marker inside the branch that knows what to do with it.
 */
export const resolveStructuralCellChildren = ({
  carriedGroupKeys,
  columnKey,
  disclosure,
  groupingKeys,
  groupSummary,
  hasStructuralMarker,
}: ResolveStructuralCellChildrenArgs) => {
  if (groupSummary !== undefined)
    return resolveGroupCellChildren({
      carriedGroupKeys,
      columnKey,
      disclosure,
      groupingKeys,
      summary: groupSummary,
    });

  // Fails closed: the row said it was structural and the validator could not
  // read it, so it is blanked rather than read as data.
  if (hasStructuralMarker) return EMPTY_CELL;

  return groupingKeys.includes(columnKey) ? EMPTY_CELL : undefined;
};
