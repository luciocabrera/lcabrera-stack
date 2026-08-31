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
  readonly hasStructuralMarker: boolean;
};

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

  if (hasStructuralMarker) return EMPTY_CELL;

  return groupingKeys.includes(columnKey) ? EMPTY_CELL : undefined;
};
