import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeEmptyFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'empty' }>;
};

/**
 * An object holding the operator code — `{ op: 'ie' }` — and deliberately not
 * the one-element array `['ie']` that a value-less filter first suggests.
 *
 * **The array form is already taken.** Every other serializer here writes an
 * array, and `serializeSelectFilter` writes an equals select filter as its bare
 * values, so `['ie']` is that filter's compact form for the single value `ie`.
 * Claiming it would make `ie` and `nie` reserved words in a position that holds
 * arbitrary user data: a URL saying "country is ie" would come back as "country
 * is empty" and show the rows where country is null — the wrong rows under the
 * right heading, and nothing anywhere says so. Two-letter lowercase values are
 * the common case for exactly the low-cardinality columns that get a select
 * filter, and this package is published, so that value space belongs to
 * consumers rather than to this codec.
 *
 * An object is outside the array space entirely, so it reserves nothing. The
 * cost is that `deserializeFilter` must test it **before** its `Array.isArray`
 * guard, which is where every other shape is decided.
 */
export const serializeEmptyFilter = ({ filter }: SerializeEmptyFilterArgs) => ({
  op: getSerializedOperator(filter.operator),
});
