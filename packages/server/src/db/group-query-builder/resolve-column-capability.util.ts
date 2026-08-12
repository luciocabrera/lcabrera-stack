import type {
  ColumnCapabilityRow,
  ColumnGroupingCapability,
} from './group-query-builder.types.ts';

import { refuseGroupKey } from './refuse-group-key.util.ts';
import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';
import { resolveDistinctEstimate } from './resolve-distinct-estimate.util.ts';
import { toRoleAggregates } from './to-role-aggregates.util.ts';

/**
 * Both ADR-058 gates for one column: what it may be grouped by, what it may be
 * aggregated with, and — when it may not be a group key — which of the reasons
 * applies.
 */
export const resolveColumnCapability = (
  row: ColumnCapabilityRow,
): ColumnGroupingCapability => {
  const role = resolveAnalyticalRole({
    typeCategory: row.typeCategory,
    typeName: row.typeName,
  });
  const estimate = resolveDistinctEstimate(row);
  const refusal = refuseGroupKey({
    estimate,
    hasEquality: row.hasEquality,
    relTuples: row.relTuples,
    role,
    typeName: row.typeName,
  });

  return {
    aggregates: toRoleAggregates({ availableSqlNames: row.aggregates, role }),
    canGroup: refusal === undefined,
    column: row.column,
    role,
    typeName: row.typeName,
    ...(estimate.kind === 'known' && { distinctEstimate: estimate.value }),
    ...(refusal !== undefined && { refusal }),
  };
};
