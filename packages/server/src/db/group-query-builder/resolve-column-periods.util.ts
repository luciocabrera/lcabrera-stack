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
