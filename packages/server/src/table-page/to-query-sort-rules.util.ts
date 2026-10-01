import type { ColumnSort } from '../sort/sort.types.ts';

type ToQuerySortRulesArgs = {
  readonly ignoredColumns?: readonly string[];
  readonly sorting: readonly unknown[];
};

const isSortRule = (value: unknown): value is ColumnSort =>
  typeof value === 'object' &&
  value !== null &&
  'columnKey' in value &&
  'direction' in value &&
  typeof value.columnKey === 'string' &&
  (value.direction === 'asc' || value.direction === 'desc');

export const toQuerySortRules = ({
  ignoredColumns = [],
  sorting,
}: ToQuerySortRulesArgs) =>
  sorting
    .filter((rule) => isSortRule(rule))
    .filter((rule) => !ignoredColumns.includes(rule.columnKey));
