import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { getSerializedOperator } from './getSerializedOperator.util';

type SerializeEmptyFilterArgs = {
  readonly filter: Extract<ColumnFilter, { readonly type: 'empty' }>;
};

/**
 * An object holding the operator code — `{ op: 'ie' }` — and deliberately not the
 * one-element array `['ie']` that a value-less filter first suggests.
 * Claiming it would make `ie` and `nie` reserved words in a position that holds arbitrary
 * user data: a URL saying "country is ie" would come back as "country is empty" and show
 * the rows where country is null — the wrong rows under the right heading, and nothing
 * anywhere says so.
 */
export const serializeEmptyFilter = ({ filter }: SerializeEmptyFilterArgs) => ({
  op: getSerializedOperator(filter.operator),
});
