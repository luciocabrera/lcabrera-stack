import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  TableGroupAggregateValue,
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '../Table.types';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { isTableAggregateFn } from './isTableAggregateFn.util';

/**
 * `value` is checked for **presence**, not for type — the same distinction
 * `toAggregateValue` documents below, and for the same reason one type over. A
 * key is whatever its column is, and `null` is a legitimate key rather than a
 * missing one: a NULL group is a group, and it is precisely the group whose
 * rows an equality would silently return nothing for. An entry carrying no `value` key
 * at all is malformed, and `Object.hasOwn` separates the two.
 *
 * `label` is still type-checked, because it is always a formatted string and
 * the hierarchy column renders it directly.
 */
const toKeyValue = (entry: unknown): TableGroupKeyValue | undefined => {
  if (!isObject(entry)) {
    return;
  }

  const { columnKey, label, value } = entry;

  return typeof columnKey === 'string' &&
    typeof label === 'string' &&
    Object.hasOwn(entry, 'value')
    ? { columnKey, label, value }
    : undefined;
};

/**
 * `value` is checked for **presence**, not for type, and those are different
 * questions. Its type is `unknown` because an aggregate is whatever its column
 * is, and `null` is a legitimate answer — `avg` over a group whose rows are all
 * NULL returns SQL NULL, which the cell should render as an absence rather than
 * a reason to reject the whole summary. An entry carrying no `value` key at all
 * is malformed, and `Object.hasOwn` is what separates the two.
 */
const toAggregateValue = (
  entry: unknown,
): TableGroupAggregateValue | undefined => {
  if (!isObject(entry)) {
    return;
  }

  const { columnKey, fn, value } = entry;

  return typeof columnKey === 'string' &&
    isTableAggregateFn(fn) &&
    Object.hasOwn(entry, 'value')
    ? { columnKey, fn, value }
    : undefined;
};

type NarrowEveryArgs<TValue> = {
  readonly narrow: (entry: unknown) => TValue | undefined;
  readonly values: readonly unknown[];
};

const narrowEvery = <TValue>({ narrow, values }: NarrowEveryArgs<TValue>) => {
  const narrowed = values.map((value) => narrow(value));

  return narrowed.every((value) => value !== undefined)
    ? (narrowed as readonly TValue[])
    : undefined;
};

/**
 * Reads a row's group summary, or `undefined` when the row is an ordinary data
 * row.
 *
 * Validating rather than casting is what lets the render path ask the row what
 * it is: the summary arrives across the loader boundary as plain JSON, so
 * `TData` says nothing about it, and a half-written summary would otherwise
 * render `undefined` into the group header. Every member is checked, and one
 * `path` or `aggregates` entry that does not narrow refuses the **whole**
 * summary — a group described by some of its keys is not the group the row
 * holds, and rendering it would label a two-key group with one key's value.
 *
 * **An empty `path` is a legal summary**, not a malformed one: it is the
 * rollup's grand total, the row that totals every group and is keyed by none
 * (ADR-065). Refusing it — which this did while `flat` was the only mode —
 * would drop the one row a rollup exists to produce, silently, as an ordinary
 * data row with no columns in it.
 */
export const getTableGroupRowSummary = (
  row: Record<string, unknown>,
): TableGroupRowSummary | undefined => {
  const summary = row[TABLE_GROUP_ROW_FIELD];

  if (!isObject(summary)) {
    return;
  }

  const { aggregates, count, isSubtotal, path } = summary;

  if (
    typeof count !== 'number' ||
    typeof isSubtotal !== 'boolean' ||
    !Array.isArray(path) ||
    !Array.isArray(aggregates)
  ) {
    return;
  }

  const narrowedPath = narrowEvery({ narrow: toKeyValue, values: path });
  const narrowedAggregates = narrowEvery({
    narrow: toAggregateValue,
    values: aggregates,
  });

  return narrowedPath === undefined || narrowedAggregates === undefined
    ? undefined
    : { aggregates: narrowedAggregates, count, isSubtotal, path: narrowedPath };
};
