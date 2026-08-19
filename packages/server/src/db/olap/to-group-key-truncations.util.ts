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
 * Pairs each requested granularity with whether its column carries a time zone —
 * the two facts `toDrillRead` needs and cannot look up for itself (#786).
 *
 * The route holds one and the catalogue the other, so this is where they meet.
 * Doing it here rather than inside the translation is what keeps that function
 * pure and its suite in the DB-free lane, exactly as `capabilities` reaching
 * `buildGroupQuery` does (ADR-058).
 *
 * A granularity naming a column with no capability is dropped rather than
 * guessed: the request that carried it is refused a step earlier by
 * `assertGroupKeys`, and inventing `isZoned: false` here would produce a range
 * computed in the wrong frame for the one case that got past it.
 */
export const toGroupKeyTruncations = ({
  capabilities,
  periods,
}: ToGroupKeyTruncationsArgs): Readonly<Record<string, GroupKeyTruncation>> => {
  const truncations: Record<string, GroupKeyTruncation> = {};

  for (const [column, period] of Object.entries(periods ?? {})) {
    const capability = capabilities[column];

    if (capability === undefined) continue;

    truncations[column] = {
      isZoned: capability.typeName === 'timestamptz',
      period,
    };
  }

  return truncations;
};
