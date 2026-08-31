import type {
  ColumnCapabilityRow,
  ColumnGroupingCapability,
} from './group-query-builder.types.ts';

import { refuseGroupKey } from './refuse-group-key.util.ts';
import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';
import { resolveColumnPeriods } from './resolve-column-periods.util.ts';
import { resolveDistinctEstimate } from './resolve-distinct-estimate.util.ts';
import { toRoleAggregates } from './to-role-aggregates.util.ts';

const toSpanDays = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const resolveColumnCapability = (
  row: ColumnCapabilityRow,
): ColumnGroupingCapability => {
  const role = resolveAnalyticalRole({
    typeCategory: row.typeCategory,
    typeName: row.typeName,
    typeNamespace: row.typeNamespace,
  });
  const estimate = resolveDistinctEstimate(row);
  const refusal = refuseGroupKey({
    estimate,
    hasEquality: row.hasEquality,
    relTuples: row.relTuples,
    role,
    typeName: row.typeName,
    typeNamespace: row.typeNamespace,
  });

  const shared = {
    aggregates: toRoleAggregates({ availableSqlNames: row.aggregates, role }),
    column: row.column,
    periods: resolveColumnPeriods({
      estimate,
      hasEquality: row.hasEquality,
      relTuples: row.relTuples,
      role,
      spanDays: toSpanDays(row.spanDays),
      typeName: row.typeName,
      typeNamespace: row.typeNamespace,
    }),
    role,
    typeName: row.typeName,
    ...(estimate.kind === 'known' && { distinctEstimate: estimate.value }),
  };

  return refusal === undefined
    ? { ...shared, canGroup: true }
    : { ...shared, canGroup: false, refusal };
};
