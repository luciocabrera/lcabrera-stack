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
import { toGroupingSetMask } from './to-grouping-set-mask.util.ts';

/**
 * The grouped read: keys, one variadic `GROUPING()` mask, the aggregates, and a
 * `GROUP BY GROUPING SETS` over the expanded sets (ADR-059).
 *
 * Pure, like its flat sibling — it never touches the pool, so its suite runs in
 * the DB-free lane. Legality it cannot derive is *passed in*: `capabilities`
 * carries the catalogue's answer per ADR-058, and every refusal below is that
 * answer being enforced rather than a second, weaker rule.
 *
 * The result carries `keys` and `groupingSetMasks` beside the SQL, because the
 * mask alone cannot be decoded — bit positions are relative to the key order,
 * so the decoder has to travel with the data it decodes.
 *
 * One departure from every other builder here: the `SELECT` list is assembled
 * first, so a `FILTER (WHERE …)` aggregate claims `$1…$k` and the query's own
 * `WHERE` starts after it.
 */
export const buildGroupQuery = ({
  aggregates,
  allowedColumns,
  capabilities,
  filters,
  grouping,
  keys,
  maxRows,
  schema,
  sort,
  subtotalPlacement,
  table,
}: GroupQueryDescriptor): BuiltGroupQuery => {
  assertSafeIdentifier(schema);
  assertSafeIdentifier(table);
  assertGroupKeys({ allowedColumns, capabilities, keys });
  assertGroupAggregates({ aggregates, allowedColumns, capabilities });

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
  const quotedKeys = keys.map((key) => quoteIdentifier(key));

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
    clauses: [{ keyword: 'LIMIT', value: maxRows }],
    startParamIndex: whereClause.nextParamIndex,
  });

  const selectList = [
    ...quotedKeys,
    `GROUPING(${quotedKeys.join(', ')}) AS ${quoteIdentifier(GROUP_MASK_ALIAS)}`,
    projection.text,
  ].join(', ');

  const text = [
    `SELECT ${selectList} FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table)}`,
    whereClause.text,
    buildGroupingSetsClause({ sets }),
    buildGroupOrderByClause({
      aggregateAliases,
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
