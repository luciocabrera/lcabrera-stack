import type {
  ColumnGroupingCapability,
  GroupKeyPeriod,
} from '../group-query-builder/group-query-builder.types.ts';
import type { GroupKeyTruncation } from './olap.types.ts';

type ToGroupKeyTruncationsArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly periods: Readonly<Record<string, GroupKeyPeriod>> | undefined;
};

export const toGroupKeyTruncations = ({
  capabilities,
  periods,
}: ToGroupKeyTruncationsArgs): Readonly<Record<string, GroupKeyTruncation>> => {
  const truncations: Record<string, GroupKeyTruncation> = {};

  const requested = Object.entries(periods ?? {});

  for (const [column, period] of requested) {
    const capability = capabilities[column];

    if (capability === undefined) continue;

    truncations[column] = {
      isZoned: capability.typeName === 'timestamptz',
      period,
    };
  }

  return truncations;
};
