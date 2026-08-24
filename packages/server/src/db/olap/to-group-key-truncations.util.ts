import type {
  ColumnGroupingCapability,
  GroupKeyPeriod,
} from '../group-query-builder/group-query-builder.types.ts';
import type { GroupKeyTruncation } from './olap.types.ts';

type ToGroupKeyTruncationsArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly periods: Readonly<Record<string, GroupKeyPeriod>> | undefined;
};

/**
 * Pairs each requested granularity with whether its column carries a time zone — the two
 * facts `toDrillRead` needs and cannot look up for itself (#786).
 * The route holds one and the catalogue the other, so this is where they meet.
 */
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
