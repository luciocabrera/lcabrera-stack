import type { GroupingMode } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { MAX_KEYS_BY_GROUPING } from './group-query-builder.constants.ts';

type AssertGroupDepthArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

export const assertGroupDepth = ({ grouping, keys }: AssertGroupDepthArgs) => {
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
