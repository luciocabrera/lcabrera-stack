import type { TableAggregateFn } from '../Table.types';

import { TABLE_AGGREGATE_LABELS } from '../Table.constants';

/**
 * Whether an unknown value is one of the aggregate tokens this package knows.
 *
 * Tested against `TABLE_AGGREGATE_LABELS`, which is a map closed over
 * `TableAggregateFn`, so the guard is total by construction — a member added to
 * the union forces a label entry and is recognised here the same day.
 *
 * `Object.hasOwn` rather than `in`: `'toString' in TABLE_AGGREGATE_LABELS` is
 * `true` through the prototype chain, which would admit a URL-supplied
 * `"toString"` as an aggregate and index the SQL map with it.
 */
export const isTableAggregateFn = (value: unknown): value is TableAggregateFn =>
  typeof value === 'string' && Object.hasOwn(TABLE_AGGREGATE_LABELS, value);
