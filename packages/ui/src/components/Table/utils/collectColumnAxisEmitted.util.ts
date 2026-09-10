import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { ColumnAxisEmittedAggregate } from './columnAxisEmitted.types';

import { getTableGroupRowSummary } from './getTableGroupRowSummary.util';

export const collectColumnAxisEmitted = (
  data: readonly unknown[],
): readonly ColumnAxisEmittedAggregate[] => {
  for (const row of data) {
    if (!isObject(row)) continue;

    const summary = getTableGroupRowSummary(row);

    if (summary === undefined) continue;

    return summary.aggregates.flatMap((entry) =>
      entry.axis === undefined || entry.alias === undefined
        ? []
        : [
            {
              alias: entry.alias,
              axis: entry.axis,
              columnKey: entry.columnKey,
              fn: entry.fn,
            },
          ],
    );
  }

  return [];
};
