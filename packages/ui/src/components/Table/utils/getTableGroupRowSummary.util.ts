import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  TableGroupAggregateValue,
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '../Table.types';

import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';
import { isTableAggregateFn } from './isTableAggregateFn.util';

const toKeyValue = (entry: unknown): TableGroupKeyValue | undefined => {
  if (!isObject(entry)) {
    return;
  }

  const { columnKey, label } = entry;

  return typeof columnKey === 'string' && typeof label === 'string'
    ? { columnKey, label }
    : undefined;
};

const toAggregateValue = (
  entry: unknown,
): TableGroupAggregateValue | undefined => {
  if (!isObject(entry)) {
    return;
  }

  const { columnKey, fn, label } = entry;

  return typeof columnKey === 'string' &&
    typeof label === 'string' &&
    isTableAggregateFn(fn)
    ? { columnKey, fn, label }
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
 */
export const getTableGroupRowSummary = (
  row: Record<string, unknown>,
): TableGroupRowSummary | undefined => {
  const summary = row[TABLE_GROUP_ROW_FIELD];

  if (!isObject(summary)) {
    return;
  }

  const { aggregates, count, path } = summary;

  if (
    typeof count !== 'number' ||
    !Array.isArray(path) ||
    path.length === 0 ||
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
    : { aggregates: narrowedAggregates, count, path: narrowedPath };
};
