import type {
  ColumnCapabilityRow,
  ColumnGroupingCapability,
} from './group-query-builder.types.ts';

import { refuseGroupKey } from './refuse-group-key.util.ts';
import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';
import { resolveColumnPeriods } from './resolve-column-periods.util.ts';
import { resolveDistinctEstimate } from './resolve-distinct-estimate.util.ts';
import { toRoleAggregates } from './to-role-aggregates.util.ts';

/**
 * Both ADR-058 gates for one column: what it may be grouped by, what it may be
 * aggregated with, at which granularities if it is temporal, and — when it may
 * not be a group key — which of the reasons applies.
 */
/**
 * The histogram span as a usable number, or nothing.
 *
 * Two shapes have to fall through here. A column with no histogram yields SQL
 * NULL, which `pg` hands over as an absence; and `extract(epoch …)` is `numeric`,
 * which `pg` hands over as a **string** unless the query casts it — the cast is
 * there, and this is what keeps a missing one from silently coercing its way
 * through the arithmetic below.
 */
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
    // Resolved whatever `refusal` said. A date column is normally refused as a
    // raw key — one group per calendar day — and that refusal is exactly the
    // reason to state which granularities do clear the guard (#786).
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

  // Two explicit branches rather than one object with a computed `canGroup`:
  // the type pairs the flag with its reason, so there is no shape in between
  // for a `boolean` expression to produce.
  return refusal === undefined
    ? { ...shared, canGroup: true }
    : { ...shared, canGroup: false, refusal };
};
