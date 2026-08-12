import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { groupingCodec } from './groupingCodec.util';

/**
 * Serialize the applied grouping configuration to the compact `grouping` URL
 * param.
 *
 * Returns `undefined` for an empty key list so the caller leaves the param off
 * the URL entirely, the way `serializeSortingToURL` does for an unsorted table
 * — a `grouping={"keys":[]}` in a shared link would say "grouping considered
 * and switched off", which is not a state this table has.
 *
 * A selected aggregate is dropped with the keys for the same reason: an
 * aggregate is computed per group, so with no key there is nothing to aggregate
 * over and nothing to describe.
 */
export const serializeGroupingToURL = ({
  aggregates,
  keys,
}: TableGroupingState) =>
  keys.length === 0
    ? undefined
    : groupingCodec.serialize({ agg: aggregates, keys });
