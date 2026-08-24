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
 * Key before aggregate (ADR-080): a URL can name one column as both. The
 * actions column carries neither.
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
