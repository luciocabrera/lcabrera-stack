import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TableGroupRowSummary } from '../Table.types';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';

/**
 * Reads a row's group summary, or `undefined` when the row is an ordinary data
 * row.
 *
 * Validating rather than casting is what lets the render path ask the row what
 * it is: the summary arrives across the loader boundary as plain JSON, so
 * `TData` says nothing about it, and a half-written summary would otherwise
 * render `undefined` into the group header. Every member is checked, so the
 * caller gets a whole summary or nothing.
 */
export const getTableGroupRowSummary = (
  row: Record<string, unknown>,
): TableGroupRowSummary | undefined => {
  const summary = row[TABLE_GROUP_ROW_FIELD];

  if (!isObject(summary)) {
    return;
  }

  const { columnKey, count, label } = summary;

  if (
    typeof columnKey !== 'string' ||
    typeof count !== 'number' ||
    typeof label !== 'string'
  ) {
    return;
  }

  return { columnKey, count, label };
};
