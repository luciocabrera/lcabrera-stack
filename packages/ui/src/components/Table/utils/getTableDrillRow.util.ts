import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { TableDrillRowKind, TableDrillRowMarker } from '../Table.types';

import { TABLE_DRILL_ROW_FIELD } from '../Table.constants';

const DRILL_ROW_KINDS = new Set<string>([
  'failed',
  'handoff',
  'loading',
] satisfies TableDrillRowKind[]);

/**
 * Reads a row's drill marker, or `undefined` when the row is not grid chrome.
 *
 * Validating rather than casting, for the reason `getTableGroupRowSummary`
 * does: the render path asks the **row** what it is, and a half-written marker
 * would otherwise render `undefined` into a cell. `path` is not narrowed
 * member-by-member here — unlike a group summary it never crosses a loader
 * boundary, since only the grid writes this field — but its presence is
 * checked, because a hand-off with no path cannot rebuild the filters it exists
 * to navigate with.
 */
export const getTableDrillRow = (
  row: Record<string, unknown>,
): TableDrillRowMarker | undefined => {
  const marker = row[TABLE_DRILL_ROW_FIELD];

  if (!isObject(marker)) return;

  const { kind, path, pathKey, shortfall } = marker;

  // `typeof kind` precedes the Set lookup because `has` needs it narrowed to a
  // string, not only because the plain checks come first.
  return typeof kind === 'string' &&
    typeof pathKey === 'string' &&
    typeof shortfall === 'number' &&
    Array.isArray(path) &&
    DRILL_ROW_KINDS.has(kind)
    ? {
        kind: kind as TableDrillRowKind,
        path: path as TableDrillRowMarker['path'],
        pathKey,
        shortfall,
      }
    : undefined;
};
