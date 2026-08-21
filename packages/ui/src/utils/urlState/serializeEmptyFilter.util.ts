import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeEmptyFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'empty' }>;
};

/**
 * The operator alone, in a one-element array.
 *
 * **An array rather than the bare short code**, which the value-less shape
 * would otherwise suggest: `deserializeFilter` refuses anything that is not an
 * array outright, so a bare `'ie'` would not round-trip at all.
 *
 * The array form only round-trips because `deserializeFilter` learned this
 * shape. Without that, `['ie']` reaches `parseEqualsSelectFilter` — the last
 * fallback, which accepts any all-string array — and comes back as a **select**
 * filter matching the literal `"ie"`: a filter that reads plausibly, matches
 * nothing, and never announces it is not the filter the URL asked for. The two
 * halves are one codec; `deserializeEmptyFilter` must be tried before that
 * fallback.
 */
export const serializeEmptyFilter = ({ filter }: SerializeEmptyFilterArgs) => [
  getSerializedOperator(filter.operator),
];
