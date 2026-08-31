import type {
  BuiltGroupQuery,
  GroupQueryDescriptor,
} from './group-query-builder.types.ts';

import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { buildOptionalNumericClauses } from '../query-builder/build-optional-numeric-clauses.util.ts';
import { buildWhereClause } from '../query-builder/build-where-clause.util.ts';
import { quoteIdentifier } from '../query-builder/quote-identifier.util.ts';
import { assertGroupAggregates } from './assert-group-aggregates.util.ts';
import { assertGroupAliases } from './assert-group-aliases.util.ts';
import { assertGroupKeys } from './assert-group-keys.util.ts';
import { buildAggregateProjection } from './build-aggregate-projection.util.ts';
import { buildGroupOrderByClause } from './build-group-order-by-clause.util.ts';
import { buildGroupingSetsClause } from './build-grouping-sets-clause.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';
import { GROUP_MASK_ALIAS } from './group-query-builder.constants.ts';
import { resolveAggregateAlias } from './resolve-aggregate-alias.util.ts';
import { resolveGroupGuardRails } from './resolve-group-guard-rails.util.ts';
import { resolveGroupKeyExpression } from './resolve-group-key-expression.util.ts';
import { toGroupingSetMask } from './to-grouping-set-mask.util.ts';

export const buildGroupQuery = ({
  aggregates,
  allowedColumns,
  capabilities,
  filters,
  grouping,
  keys,
  maxRows,
  periods,
  schema,
  sort,
  subtotalPlacement,
  table,
}: GroupQueryDescriptor): BuiltGroupQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);
  assertGroupKeys({ allowedColumns, capabilities, grouping, keys, periods });
  assertGroupAggregates({ aggregates, allowedColumns, capabilities });

  const guardRails = resolveGroupGuardRails({
    capabilities,
    grouping,
    keys,
    maxRows,
  });

  const aliased = aggregates.map((aggregate) => ({
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
    keys.map((key) => [
      key,
      resolveGroupKeyExpression({
        key,
        period: periods?.[key],
        typeName: capabilities[key]?.typeName,
      }),
    ]),
  );
  const keyExpressions = keys.map((key) => expressionByKey[key] ?? key);

  const projection = buildAggregateProjection({
    aliased,
    allowedColumns,
    startParamIndex: 1,
  });
  const whereClause = buildWhereClause({
    allowedColumns,
    filters,
    startParamIndex: projection.nextParamIndex,
  });
  const limitClause = buildOptionalNumericClauses({
    clauses: [{ keyword: 'LIMIT', value: guardRails.rowLimit.limit }],
    startParamIndex: whereClause.nextParamIndex,
  });

  const selectList = [
    ...keys.map((key, index) =>
      periods?.[key] === undefined
        ? keyExpressions[index]
        : `${keyExpressions[index]} AS ${quoteIdentifier(key)}`,
    ),
    `GROUPING(${keyExpressions.join(', ')}) AS ${quoteIdentifier(GROUP_MASK_ALIAS)}`,
    projection.text,
  ].join(', ');

  const text = [
    `SELECT ${selectList} FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table)}`,
    whereClause.text,
    buildGroupingSetsClause({ expressionByKey, sets }),
    buildGroupOrderByClause({
      aggregateAliases,
      expressionByKey,
      keys,
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
      ...(aggregate.column !== undefined && { column: aggregate.column }),
    })),
    groupingSetMasks: sets.map((set) => toGroupingSetMask({ keys, set })),
    guardRails,
    keys,
    maskAlias: GROUP_MASK_ALIAS,
    text,
    values: [
      ...projection.values,
      ...whereClause.values,
      ...limitClause.values,
    ],
  };
};
