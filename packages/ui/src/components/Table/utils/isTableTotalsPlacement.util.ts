import type { TableTotalsPlacement } from '../Table.types';

import { TABLE_TOTALS_PLACEMENT_LABELS } from '../Table.constants';

/**
 * Tested against `TABLE_TOTALS_PLACEMENT_LABELS`, a map closed over
 * `TableTotalsPlacement`, so the guard is total by construction — the same shape
 * `isTableGroupingMode` uses.
 * It guards two client-controlled channels, the `totals` search param and the UI-flags
 * cookie, and the value reaches the `ORDER BY` direction of a `GROUPING()` term — so an
 * unrecognised token has to fall back to the default rather than travel.
 */
export const isTableTotalsPlacement = (
  value: unknown,
): value is TableTotalsPlacement =>
  typeof value === 'string' &&
  Object.hasOwn(TABLE_TOTALS_PLACEMENT_LABELS, value);
