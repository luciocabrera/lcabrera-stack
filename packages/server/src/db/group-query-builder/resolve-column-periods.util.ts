import type {
  ColumnAnalyticalRole,
  DistinctEstimate,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { GROUP_KEY_PERIODS } from './group-query-builder.constants.ts';
import { isPeriodCapableType } from './is-period-capable-type.util.ts';
import { refuseGroupKey } from './refuse-group-key.util.ts';
import { resolvePeriodDistinctEstimate } from './resolve-period-distinct-estimate.util.ts';

type ResolveColumnPeriodsArgs = {
  readonly estimate: DistinctEstimate;
  readonly hasEquality: boolean;
  readonly relTuples: number;
  readonly role: ColumnAnalyticalRole;
  readonly spanDays: number | undefined;
  readonly typeName: string;
  readonly typeNamespace: string;
};

const NO_PERIODS: readonly GroupKeyPeriod[] = [];

/**
 * It runs the **same refusal ladder** the raw column runs, with the period's estimate
 * substituted — deliberately, rather than checking cardinality alone.
 * A period changes exactly one input; role, equality and the unique-ish rule are facts
 * about the column and must not become negotiable because a granularity was asked for.
 */
export const resolveColumnPeriods = ({
  estimate,
  hasEquality,
  relTuples,
  role,
  spanDays,
  typeName,
  typeNamespace,
}: ResolveColumnPeriodsArgs): readonly GroupKeyPeriod[] => {
  if (!isPeriodCapableType({ typeName, typeNamespace })) return NO_PERIODS;

  return GROUP_KEY_PERIODS.filter(
    (period) =>
      refuseGroupKey({
        estimate: resolvePeriodDistinctEstimate({ estimate, period, spanDays }),
        hasEquality,
        relTuples,
        role,
        typeName,
        typeNamespace,
      }) === undefined,
  );
};
