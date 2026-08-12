import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { CompactSorting } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/**
 * Accepts `{ columnKey: 'asc' | 'desc' }` and nothing else. A single direction
 * outside that vocabulary refuses the payload outright rather than dropping one
 * key: a half-applied sort reorders a shared link's rows while still looking
 * like the sort that was linked, which is worse than no sort at all.
 */
const narrowCompactSorting = (parsed: unknown) => {
  if (!isObject(parsed) || Array.isArray(parsed)) {
    return;
  }

  const compact: CompactSorting = {};

  for (const [columnKey, direction] of Object.entries(parsed)) {
    if (direction !== 'asc' && direction !== 'desc') {
      return;
    }

    compact[columnKey] = direction;
  }

  return compact;
};

/** Codec for the compact `sorting` search param. */
export const sortingCodec = createUrlStateCodec<CompactSorting>({
  compact: (state) => state,
  fallback: {},
  label: 'sorting',
  narrow: narrowCompactSorting,
});
