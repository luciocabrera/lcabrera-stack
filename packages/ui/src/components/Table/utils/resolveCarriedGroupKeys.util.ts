import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

type ResolveCarriedGroupKeysArgs = {
  readonly isWindowFirst: boolean;
  readonly previousRow: Record<string, unknown> | undefined;
  readonly summary: TableGroupRowSummary | undefined;
};

const NOTHING_CARRIED: ReadonlySet<string> = new Set();

export const resolveCarriedGroupKeys = ({
  isWindowFirst,
  previousRow,
  summary,
}: ResolveCarriedGroupKeysArgs): ReadonlySet<string> => {
  if (isWindowFirst || summary === undefined || previousRow === undefined)
    return NOTHING_CARRIED;

  const previousSummary = getTableGroupRowSummary(previousRow);

  if (previousSummary === undefined) return NOTHING_CARRIED;

  const carried = new Set<string>();

  const ancestors = summary.path.slice(0, -1);

  for (const [level, entry] of ancestors.entries()) {
    const previousEntry = previousSummary.path[level];

    if (
      previousEntry?.columnKey !== entry.columnKey ||
      previousEntry.label !== entry.label
    )
      break;

    carried.add(entry.columnKey);
  }

  return carried;
};
