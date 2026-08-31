import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import {
  TABLE_GROUP_GRAND_TOTAL_LABEL,
  TABLE_GROUP_SUBTOTAL_SUFFIX,
} from '#ui/components/Table/Table.constants';

type ResolveGroupKeyCellTextArgs = {
  readonly columnKey: string;
  readonly groupingKeys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

export const resolveGroupKeyCellText = ({
  columnKey,
  groupingKeys,
  summary,
}: ResolveGroupKeyCellTextArgs) => {
  const entry = summary.path.find((level) => level.columnKey === columnKey);

  if (entry === undefined) {
    return groupingKeys[0] === columnKey && summary.path.length === 0
      ? { isInnermost: true, text: TABLE_GROUP_GRAND_TOTAL_LABEL }
      : undefined;
  }

  const isInnermost = summary.path.at(-1)?.columnKey === columnKey;

  return {
    isInnermost,
    text:
      isInnermost && summary.isSubtotal
        ? `${entry.label} ${TABLE_GROUP_SUBTOTAL_SUFFIX}`
        : entry.label,
  };
};
