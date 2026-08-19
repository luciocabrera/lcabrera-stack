import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types';
import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';

/**
 * How one group key was truncated, as the drill translation needs it: the
 * granularity, and whether the column carried a time zone.
 *
 * `isZoned` is here rather than being looked up because the translation is pure
 * and the column's type is a catalogue fact — the route resolves it once (see
 * `toGroupKeyTruncations`) and hands the answer down, the same way
 * `capabilities` reaches the builder (ADR-058).
 */
export type GroupKeyTruncation = {
  readonly isZoned: boolean;
  readonly period: GroupKeyPeriod;
};

/**
 * The paginated read of the rows underneath one group row.
 *
 * Structurally a subset of what a route's own page-select takes, so a caller
 * spreads it into that call rather than mapping it member by member.
 *
 * **It carries no grouping.** Passing the view's grouping through would send the
 * read straight back into the grouped branch and return group rows again — the
 * one mistake that looks like it works.
 */
export type OlapDrillRead = {
  readonly filters: readonly QueryFilter[];
  readonly includeTotal: boolean;
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
};

/**
 * Why a group row cannot be drilled. Distinguishable because they call for
 * different UI: a subtotal and a grand total should never offer the affordance
 * at all, where an incomplete path means the request and the row disagree and is
 * a bug rather than a state.
 */
export type OlapDrillRefusal = 'grand-total' | 'incomplete-path' | 'subtotal';

export type OlapDrillTranslation =
  | { readonly kind: 'drillable'; readonly read: OlapDrillRead }
  | { readonly kind: 'refused'; readonly reason: OlapDrillRefusal };
