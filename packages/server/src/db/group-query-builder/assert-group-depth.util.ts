import type { GroupingMode } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { MAX_KEYS_BY_GROUPING } from './group-query-builder.constants.ts';

type AssertGroupDepthArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

/**
 * Everything about a group-key list that can be judged from the list and the
 * mode alone: that there is one, that it is not too deep **for that mode**, and
 * that no key repeats.
 *
 * Split out of `assertGroupKeys` because it is the half that needs **no
 * catalogue answer**, which is what lets `selectGroupedRows` run it before it
 * borrows a connection. A request at depth 9 costing a catalogue round trip
 * before being refused is a request that pays for the mistake it is about to be
 * told about (ADR-066).
 *
 * `assertGroupKeys` still calls it, so the builder refuses the same shapes on
 * its own — the pre-flight check is an earlier gate, never the only one.
 *
 * The cap is per mode because cube's set count is exponential in the depth
 * where the others' is linear. `MAX_KEYS_BY_GROUPING` carries the numbers, and
 * why the cardinality estimate cannot enforce this in the cap's place.
 */
export const assertGroupDepth = ({
  grouping,
  keys,
}: AssertGroupDepthArgs): void => {
  if (keys.length === 0) {
    throw new GroupingRefusedError({
      message: 'A grouped query needs at least one group key.',
      reason: 'no-keys',
    });
  }

  const maxKeys = MAX_KEYS_BY_GROUPING[grouping];

  if (keys.length > maxKeys) {
    throw new GroupingRefusedError({
      message: `A ${grouping} grouping takes at most ${maxKeys} group keys; got ${keys.length}.`,
      reason: 'too-many-keys',
    });
  }

  if (new Set(keys).size !== keys.length) {
    throw new GroupingRefusedError({
      message: `Group keys must be distinct; got "${keys.join('", "')}".`,
      reason: 'duplicate-keys',
    });
  }
};
