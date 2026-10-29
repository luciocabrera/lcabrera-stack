import type { GroupFilter, GroupingMode } from './group-query-builder.types.ts';

import { QueryRefusedError } from '../../errors/query-refused.error.ts';

type AssertGroupFiltersArgs = {
  readonly aggregateAliases: readonly string[];
  readonly groupFilters?: readonly GroupFilter[];
  readonly grouping: GroupingMode;
  readonly hasColumnAxis: boolean;
};

const GROUP_FILTER_OPERATORS: ReadonlySet<string> = new Set([
  'eq',
  'gt',
  'gte',
  'in',
  'isNotNull',
  'isNull',
  'lt',
  'lte',
  'neq',
]);

export const assertGroupFilters = ({
  aggregateAliases,
  groupFilters = [],
  grouping,
  hasColumnAxis,
}: AssertGroupFiltersArgs) => {
  if (groupFilters.length === 0) {
    return;
  }

  if (grouping !== 'flat') {
    throw new QueryRefusedError({
      message: `A group filter is refused with grouping "${grouping}": HAVING would test every subtotal too, and a subtotal is computed over all its children, not only the ones that pass.`,
      reason: 'group-filter-grouping-unsupported',
    });
  }

  if (hasColumnAxis) {
    throw new QueryRefusedError({
      message:
        'A group filter is refused on a read with a column axis: the axis expands each aggregate into one per axis value, so the alias names no single expression.',
      reason: 'group-filter-column-axis',
    });
  }

  for (const { aggregateAlias, operator } of groupFilters) {
    if (!aggregateAliases.includes(aggregateAlias)) {
      throw new QueryRefusedError({
        message: `Cannot filter groups by "${aggregateAlias}": it is not one of this query's aggregates.`,
        reason: 'group-filter-alias-unknown',
      });
    }

    if (!GROUP_FILTER_OPERATORS.has(operator)) {
      throw new QueryRefusedError({
        message: `Cannot filter groups by "${aggregateAlias}" with "${String(operator)}"; a group filter takes ${[...GROUP_FILTER_OPERATORS].join(', ')}.`,
        reason: 'group-filter-operator-unsupported',
      });
    }
  }
};
