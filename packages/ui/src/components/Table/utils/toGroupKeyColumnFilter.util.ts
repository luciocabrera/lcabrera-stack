import type { ColumnFilter } from '#ui/types/filterOperators.types';

import type { TableColumnDataType } from '../Table.types';

type ToGroupKeyColumnFilterArgs = {
  readonly dataType: TableColumnDataType | undefined;
  readonly value: unknown;
};

/**
 * One group key's value as the column filter that restricts to it — what a
 * hand-off navigates with (ADR-079).
 *
 * **A NULL key produces no filter, and that is a refusal rather than a
 * fallback.** The filter vocabulary has no "is null" member — it models what a
 * user can type into the filter UI — so the closest expressible thing is an
 * equality against the empty string, which matches nothing. A hand-off built
 * that way would open a table that is silently empty, on the group a reader is
 * most likely to be puzzled by and click. `undefined` lets the caller decline to
 * offer the hand-off at all, which is the honest answer until the vocabulary can
 * say it.
 *
 * The **column's** declared type decides the shape, not the value's runtime
 * type: the filter has to round-trip through the URL codec and back into a
 * query, and the codec keys off `type`. A numeric key arriving as a string —
 * which JSON does for `bigint` and `numeric` — must still produce a
 * `NumberFilter`, or the query compares a number column against text.
 */
export const toGroupKeyColumnFilter = ({
  dataType,
  value,
}: ToGroupKeyColumnFilterArgs): ColumnFilter | undefined => {
  if (value === null || value === undefined) return;

  if (dataType === 'boolean')
    return { type: 'boolean', value: value === true || value === 'true' };

  // `currency` is a presentation choice over a numeric column, so it takes the
  // number filter — treating it as text would compare a numeric column against
  // a formatted string and match nothing.
  if (dataType === 'currency' || dataType === 'number') {
    const numeric = Number(value);

    return Number.isFinite(numeric)
      ? { operator: 'equals', type: 'number', value: numeric }
      : undefined;
  }

  if (dataType === 'date') {
    if (value instanceof Date)
      return { operator: 'equals', type: 'date', value: value.toISOString() };

    return typeof value === 'string'
      ? { operator: 'equals', type: 'date', value }
      : undefined;
  }

  // **An object-valued key produces no filter**, for the reason a NULL one does
  // not. `String()` over one yields `[object Object]`, which is a filter that
  // matches nothing and says nothing about why — and a `jsonb` or composite
  // column is a legal group key, so this is reachable rather than defensive.
  if (typeof value === 'string')
    return { operator: 'equals', type: 'text', value };

  return typeof value === 'bigint' || typeof value === 'number'
    ? { operator: 'equals', type: 'text', value: String(value) }
    : undefined;
};
