import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { pruneColumnAxis } from '#ui/components/Table/contexts/TableConfig/grouping/utils';

type SetTableColumnAxisArgs = {
  readonly columnAxis: string | undefined;
  readonly grouping: TableGroupingState;
};

export const setTableColumnAxis = ({
  columnAxis,
  grouping,
}: SetTableColumnAxisArgs): TableGroupingState => {
  const next = pruneColumnAxis({ columnAxis, keys: grouping.keys });

  if (columnAxis !== undefined && next === undefined) return grouping;

  if (next === grouping.columnAxis) return grouping;

  return {
    ...grouping,
    columnAxis: next,
  };
};
