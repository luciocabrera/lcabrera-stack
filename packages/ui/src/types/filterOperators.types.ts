/**
 * Column-filter types for the Table filter UI.
 *
 * The filter *shapes* (`BooleanFilter`/`ColumnFilter`/`DateFilter`/…) are the
 * shared contract between this UI and the generic query layer, so they live in
 * `@repo/data-access/filters/filters.types` (where the `to*QueryFilters`
 * mappers translate them to SQL `QueryFilter`s) and are re-exported here for the
 * Table's many internal call sites. The operator/option *label* types below are
 * UI-only — the filter dropdowns' concern — and stay here.
 */

import type {
  DateFilter,
  NumberFilter,
  TextFilter,
} from '@repo/data-access/filters/filters.types';

export type {
  BooleanFilter,
  ColumnFilter,
  DateFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from '@repo/data-access/filters/filters.types';

export type DateOperatorType = DateFilter['operator'];

export type NumberOperatorType = NumberFilter['operator'];

export type OperatorOption<T extends string = string> = {
  readonly label: string;
  readonly value: T;
};

export type OperatorType =
  | DateOperatorType
  | NumberOperatorType
  | TextOperatorType;

export type TextOperatorType = TextFilter['operator'];
