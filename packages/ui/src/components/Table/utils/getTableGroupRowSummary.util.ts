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

  const { columnKey, label, value } = entry;

  return typeof columnKey === 'string' &&
    typeof label === 'string' &&
    Object.hasOwn(entry, 'value')
    ? { columnKey, label, value }
    : undefined;
};

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
