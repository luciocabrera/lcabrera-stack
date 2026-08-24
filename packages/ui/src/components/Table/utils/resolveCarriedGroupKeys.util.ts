import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

type ResolveCarriedGroupKeysArgs = {
  /**
   * Whether this row is the first one the virtualization window paints.
   * It refills instead (ADR-080).
   */
  readonly isWindowFirst: boolean;
  readonly previousRow: Record<string, unknown> | undefined;
  readonly summary: TableGroupRowSummary | undefined;
};

const NOTHING_CARRIED: ReadonlySet<string> = new Set();

/** **The row's own innermost level is never carried**, so every group row states something. */
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

  // `length - 1` rather than `length`: the innermost level always draws.
  for (let level = 0; level < summary.path.length - 1; level += 1) {
    const entry = summary.path[level];
    const previousEntry = previousSummary.path[level];

    if (entry === undefined || previousEntry === undefined) break;
    if (entry.columnKey !== previousEntry.columnKey) break;
    if (entry.label !== previousEntry.label) break;

    carried.add(entry.columnKey);
  }

  return carried;
};
