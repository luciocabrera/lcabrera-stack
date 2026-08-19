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
  readonly spanDays: number | null;
  readonly typeName: string;
  readonly typeNamespace: string;
};

const NO_PERIODS: readonly GroupKeyPeriod[] = [];

/**
 * The granularities this column may legally be grouped at (#786).
 *
 * It runs the **same refusal ladder** the raw column runs, with the period's
 * estimate substituted — deliberately, rather than checking cardinality alone.
 * A period changes exactly one input; role, equality and the unique-ish rule are
 * facts about the column and must not become negotiable because a granularity
 * was asked for. Reusing `refuseGroupKey` is what makes that structural instead
 * of a promise.
 *
 * A column of a type no granularity applies to answers with an empty list, which
 * is also the answer for every non-temporal column — so a surface reads one
 * field rather than asking the type a second question of its own.
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
