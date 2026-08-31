import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { CompactSorting } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

const isDirectionEntry = (
  entry: [string, unknown],
): entry is [string, 'asc' | 'desc'] =>
  entry[1] === 'asc' || entry[1] === 'desc';

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

export const sortingCodec = createUrlStateCodec<CompactSorting>({
  compact: (state) => state,
  fallback: {},
  label: 'sorting',
  narrow: narrowCompactSorting,
});
