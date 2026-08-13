import type { TableGroupingMode } from '../Table.types';

import { TABLE_GROUPING_MODE_LABELS } from '../Table.constants';

/**
 * Whether an unknown value is one of the grouping modes this package renders.
 *
 * Tested against `TABLE_GROUPING_MODE_LABELS`, a map closed over
 * `TableGroupingMode`, so the guard is total by construction — the same shape
 * `isTableAggregateFn` uses, and for the same reason: a member added to the
 * union forces a label entry and is recognised here the same day.
 *
 * `Object.hasOwn` rather than `in`, so a URL-supplied `"toString"` is not
 * admitted through the prototype chain.
 */
export const isTableGroupingMode = (
  value: unknown,
): value is TableGroupingMode =>
  typeof value === 'string' && Object.hasOwn(TABLE_GROUPING_MODE_LABELS, value);
