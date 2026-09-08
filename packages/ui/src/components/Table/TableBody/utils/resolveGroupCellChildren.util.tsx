import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { TableGroupAggregate } from '#ui/components/Table/TableGroupAggregate';
import { TableGroupKeyCell } from '#ui/components/Table/TableGroupKeyCell';

type ResolveGroupCellChildrenArgs = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

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

  return <TableGroupAggregate columnKey={columnKey} summary={summary} />;
};
