import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type {
  ColumnFilter,
  DateFilter,
  EmptyFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from './filters.types.ts';

type AbsentOrArgs = {
  readonly check: (value: unknown) => boolean;
  readonly fields: FilterFields;
  readonly key: string;
};

type FilterFields = Readonly<Record<string, unknown>>;

type OperatorSet<TOperator extends string> = Readonly<Record<TOperator, true>>;

const DATE_OPERATORS: OperatorSet<DateFilter['operator']> = {
  after: true,
  before: true,
  between: true,
  equals: true,
};

const EMPTY_OPERATORS: OperatorSet<EmptyFilter['operator']> = {
  isEmpty: true,
  isNotEmpty: true,
};

const NUMBER_OPERATORS: OperatorSet<NumberFilter['operator']> = {
  between: true,
  equals: true,
  greaterThan: true,
  greaterThanOrEqual: true,
  lessThan: true,
  lessThanOrEqual: true,
  notEquals: true,
};

const SELECT_OPERATORS: OperatorSet<NonNullable<SelectFilter['operator']>> = {
  equals: true,
  notEquals: true,
};

const TEXT_OPERATORS: OperatorSet<TextFilter['operator']> = {
  contains: true,
  endsWith: true,
  equals: true,
  notContains: true,
  notEquals: true,
  startsWith: true,
};

const isString = (value: unknown) => typeof value === 'string';

const isFiniteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value);

const isStringList = (value: unknown) =>
  Array.isArray(value) && value.every((item) => isString(item));

const toOperatorCheck =
  (operators: OperatorSet<string>) =>
  (value: unknown): boolean =>
    typeof value === 'string' && Object.hasOwn(operators, value);

const isAbsentOr = ({ check, fields, key }: AbsentOrArgs) =>
  fields[key] === undefined || check(fields[key]);

const isSelectFilter = (fields: FilterFields) =>
  isAbsentOr({
    check: toOperatorCheck(SELECT_OPERATORS),
    fields,
    key: 'operator',
  }) &&
  isAbsentOr({ check: isString, fields, key: 'value' }) &&
  isAbsentOr({ check: isStringList, fields, key: 'values' });

const VARIANT_CHECKS: Readonly<
  Record<ColumnFilter['type'], (fields: FilterFields) => boolean>
> = {
  boolean: ({ value }) => typeof value === 'boolean',
  date: (fields) =>
    toOperatorCheck(DATE_OPERATORS)(fields.operator) &&
    isString(fields.value) &&
    isAbsentOr({ check: isString, fields, key: 'value2' }),
  empty: ({ operator }) => toOperatorCheck(EMPTY_OPERATORS)(operator),
  multiSelect: isSelectFilter,
  number: (fields) =>
    toOperatorCheck(NUMBER_OPERATORS)(fields.operator) &&
    isAbsentOr({ check: isFiniteNumber, fields, key: 'value' }) &&
    isAbsentOr({ check: isFiniteNumber, fields, key: 'value2' }),
  select: isSelectFilter,
  text: (fields) =>
    toOperatorCheck(TEXT_OPERATORS)(fields.operator) && isString(fields.value),
};

const isFilterType = (value: unknown): value is ColumnFilter['type'] =>
  typeof value === 'string' && Object.hasOwn(VARIANT_CHECKS, value);

export const isColumnFilter = (value: unknown): value is ColumnFilter =>
  isObject(value) &&
  !Array.isArray(value) &&
  isFilterType(value.type) &&
  VARIANT_CHECKS[value.type](value);
