import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { isStringList } from '@lcabrera/utils/guards/is-string-list.util';

import type { ColumnFilter } from './filters.types.ts';

import {
  DATE_FILTER_OPERATORS,
  EMPTY_FILTER_OPERATORS,
  NUMBER_FILTER_OPERATORS,
  SELECT_FILTER_OPERATORS,
  TEXT_FILTER_OPERATORS,
} from './filters.constants.ts';
import { isAbsentOr } from './is-absent-or.util.ts';
import { isFilterOperator } from './is-filter-operator.util.ts';

type FilterFields = Readonly<Record<string, unknown>>;

const VARIANT_CHECKS: Readonly<
  Record<ColumnFilter['type'], (fields: FilterFields) => boolean>
> = {
  boolean: ({ value }) => typeof value === 'boolean',
  date: (fields) =>
    isFilterOperator({
      operators: DATE_FILTER_OPERATORS,
      value: fields.operator,
    }) &&
    typeof fields.value === 'string' &&
    isAbsentOr({
      check: (value) => typeof value === 'string',
      fields,
      key: 'value2',
    }),
  empty: ({ operator }) =>
    isFilterOperator({ operators: EMPTY_FILTER_OPERATORS, value: operator }),
  multiSelect: (fields) => VARIANT_CHECKS.select(fields),
  number: (fields) =>
    isFilterOperator({
      operators: NUMBER_FILTER_OPERATORS,
      value: fields.operator,
    }) &&
    isAbsentOr({ check: isFiniteNumber, fields, key: 'value' }) &&
    isAbsentOr({ check: isFiniteNumber, fields, key: 'value2' }),
  select: (fields) =>
    isAbsentOr({
      check: (value) =>
        isFilterOperator({ operators: SELECT_FILTER_OPERATORS, value }),
      fields,
      key: 'operator',
    }) &&
    isAbsentOr({
      check: (value) => typeof value === 'string',
      fields,
      key: 'value',
    }) &&
    isAbsentOr({ check: isStringList, fields, key: 'values' }),
  text: (fields) =>
    isFilterOperator({
      operators: TEXT_FILTER_OPERATORS,
      value: fields.operator,
    }) && typeof fields.value === 'string',
};

export const isColumnFilter = (value: unknown): value is ColumnFilter =>
  isObject(value) &&
  !Array.isArray(value) &&
  typeof value.type === 'string' &&
  Object.hasOwn(VARIANT_CHECKS, value.type) &&
  VARIANT_CHECKS[value.type as ColumnFilter['type']](value);
