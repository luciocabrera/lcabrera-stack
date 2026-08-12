import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { CompactSorting } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

const isDirectionEntry = (
  entry: [string, unknown],
): entry is [string, 'asc' | 'desc'] =>
  entry[1] === 'asc' || entry[1] === 'desc';

/**
 * Accepts `{ columnKey: 'asc' | 'desc' }` and nothing else. A single direction
 * outside that vocabulary refuses the payload outright rather than dropping one
 * key: a half-applied sort reorders a shared link's rows while still looking
 * like the sort that was linked, which is worse than no sort at all.
 *
 * Rebuilt with `Object.fromEntries` rather than by assigning into `{}`. Plain
 * assignment routes a `__proto__` key to the prototype setter, which silently
 * drops that one key — a per-field drop, the one outcome this contract exists
 * to rule out. `Object.fromEntries` defines an own property instead, so the key
 * survives and nothing reaches `Object.prototype`.
 */
const narrowCompactSorting = (parsed: unknown) => {
  if (!isObject(parsed) || Array.isArray(parsed)) {
    return;
  }

  const entries = Object.entries(parsed);

  if (!entries.every(isDirectionEntry)) {
    return;
  }

  return Object.fromEntries(entries);
};

/** Codec for the compact `sorting` search param. */
export const sortingCodec = createUrlStateCodec<CompactSorting>({
  compact: (state) => state,
  fallback: {},
  label: 'sorting',
  narrow: narrowCompactSorting,
});
