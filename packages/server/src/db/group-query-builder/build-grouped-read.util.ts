import type {
  BuiltGroupQuery,
  GroupQueryDescriptor,
} from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { buildOptionalNumericClauses } from '../query-builder/build-optional-numeric-clauses.util.ts';
import { buildWhereClause } from '../query-builder/build-where-clause.util.ts';
import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { resolveReadScope } from '../query-builder/resolve-read-scope.util.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';
import { assertColumnAxis } from './assert-column-axis.util.ts';
import { assertGroupAggregates } from './assert-group-aggregates.util.ts';
import { assertGroupAliases } from './assert-group-aliases.util.ts';
import { assertGroupFilters } from './assert-group-filters.util.ts';
import { assertGroupKeys } from './assert-group-keys.util.ts';
import { buildAggregateProjection } from './build-aggregate-projection.util.ts';
import { buildGroupOrderByClause } from './build-group-order-by-clause.util.ts';
import { buildGroupingSetsClause } from './build-grouping-sets-clause.util.ts';
import { buildHavingClause } from './build-having-clause.util.ts';
import { expandColumnAxisAggregates } from './expand-column-axis-aggregates.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';
import {
  GROUP_MASK_ALIAS,
  MAX_COUNT_DISTINCT_AGGREGATES,
} from './group-query-builder.constants.ts';
import { isUnexpandedLeadingCount } from './is-unexpanded-leading-count.util.ts';
import { resolveAggregateAlias } from './resolve-aggregate-alias.util.ts';
import { resolveGroupGuardRails } from './resolve-group-guard-rails.util.ts';
import { resolveGroupKeyColumns } from './resolve-group-key-columns.util.ts';
import { toExpandingMeasureCount } from './to-expanding-measure-count.util.ts';
import { toGroupingSetMask } from './to-grouping-set-mask.util.ts';

export const buildGroupedRead = ({
  aggregates,
  allowedColumns,
  capabilities,
  columnAxis,
  filters,
  groupFilters,
  grouping,
  joins,
  keys: keyReferences,
  maxRows,
  periods,
  relations,
  schema,
  sort,
  subtotalPlacement,
  table,
}: GroupQueryDescriptor): BuiltGroupQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);

  const scope = resolveReadScope({
    allowedColumns,
    joins,
    relations,
    schema,
    table,
  });

  assertGroupKeys({
    allowedColumns,
    capabilities,
    grouping,
    keys: keyReferences,
    periods,
    scope,
  });
  assertGroupFilters({
    aggregateAliases: aggregates.map((aggregate) =>
      resolveAggregateAlias(aggregate),
    ),
    groupFilters,
    grouping,
    hasColumnAxis: columnAxis !== undefined,
  });

  const leadingCount = aggregates[0];
  const hasUnexpandedCount = isUnexpandedLeadingCount(leadingCount);
  const expandable = hasUnexpandedCount ? aggregates.slice(1) : aggregates;

  if (columnAxis !== undefined) {
    assertColumnAxis({
      allowedColumns,
      capabilities,
      columnAxis,
      keys: keyReferences,
      measureCount: toExpandingMeasureCount(aggregates),
      scope,
      ...(hasUnexpandedCount && { fixedAggregateCount: 1 }),
    });
  }

  assertGroupAggregates({ aggregates, allowedColumns, capabilities, scope });
  const expanded =
    columnAxis === undefined
      ? undefined
      : [
          ...(hasUnexpandedCount && leadingCount !== undefined
            ? [leadingCount]
            : []),
          ...expandColumnAxisAggregates({
            aggregates: expandable,
            columnAxis,
          }),
        ];
  const queryAggregates = expanded ?? aggregates;

  if (expanded !== undefined) {
    const distinctCount = expanded.filter(
      (aggregate) => aggregate.fn === 'countDistinct',
    ).length;

    if (distinctCount > MAX_COUNT_DISTINCT_AGGREGATES) {
      throw new GroupingRefusedError({
        message: `A grouped query takes at most ${MAX_COUNT_DISTINCT_AGGREGATES} countDistinct aggregate; a column axis would emit ${distinctCount}.`,
        reason: 'aggregate-not-legal',
      });
    }
  }

  const keyColumns = resolveGroupKeyColumns({
    allowedColumns,
    capabilities,
    keys: keyReferences,
    periods,
    scope,
  });
  const keys = keyColumns.map(({ name }) => name);
  const guardRails = resolveGroupGuardRails({
    capabilities,
    grouping,
    keys,
    maxRows,
  });

  const aliased = queryAggregates.map((aggregate) => ({
    aggregate,
    alias: resolveAggregateAlias(aggregate),
  }));
  const aggregateAliases = aliased.map(({ alias }) => alias);

  assertGroupAliases({
    aliases: [GROUP_MASK_ALIAS, ...aggregateAliases],
    allowedColumns,
  });

  const sets = expandGroupingSets({ grouping, keys });
  const expressionByKey = Object.fromEntries(
    keyColumns.map(({ expression, name }) => [name, expression]),
  );
  const keyExpressions = keyColumns.map(({ expression }) => expression);

  const projection = buildAggregateProjection({
    aliased,
    allowedColumns,
    scope,
    startParamIndex: 1,
  });
  const whereClause = buildWhereClause({
    allowedColumns,
    filters,
    scope,
    startParamIndex: projection.nextParamIndex,
  });
  const havingClause = buildHavingClause({
    expressions: projection.expressions,
    groupFilters,
    startParamIndex: whereClause.nextParamIndex,
  });
  const limitClause = buildOptionalNumericClauses({
    clauses: [{ keyword: 'LIMIT', value: guardRails.rowLimit.limit }],
    startParamIndex: havingClause.nextParamIndex,
  });

  const selectList = [
    ...keyColumns.map(({ projection: keyProjection }) => keyProjection),
    `GROUPING(${keyExpressions.join(', ')}) AS ${quoteIdentifier(GROUP_MASK_ALIAS)}`,
    ...(projection.text.length > 0 ? [projection.text] : []),
  ].join(', ');
  const from =
    scope?.from ?? `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;

  const text = [
    `SELECT ${selectList} FROM ${from}`,
    whereClause.text,
    buildGroupingSetsClause({ expressionByKey, sets }),
    havingClause.text,
    buildGroupOrderByClause({
      aggregateAliases,
      expressionByKey,
      hasColumnAxis: columnAxis !== undefined,
      keys: keyReferences,
      sets,
      sort,
      subtotalPlacement,
    }),
    limitClause.text,
  ]
    .filter((part) => part.length > 0)
    .join(' ');

  return {
    aggregates: aliased.map(({ aggregate, alias }) => ({
      alias,
      fn: aggregate.fn,
      ...(aggregate.column !== undefined && {
        column: toColumnName(aggregate.column),
      }),
      ...('axisValue' in aggregate && { axis: { value: aggregate.axisValue } }),
    })),
    groupingSetMasks: sets.map((set) => toGroupingSetMask({ keys, set })),
    guardRails,
    keys,
    maskAlias: GROUP_MASK_ALIAS,
    ...(columnAxis !== undefined && {
      columnAxis: {
        key: toColumnName(columnAxis.key),
        values: columnAxis.values.map((value) => value ?? undefined),
      },
    }),
    text,
    values: [
      ...projection.values,
      ...whereClause.values,
      ...havingClause.values,
      ...limitClause.values,
    ],
  };
};
