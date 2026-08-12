import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

/**
 * Whether a group-key list is a legal **shape** for a grouping: no more than
 * `MAX_TABLE_GROUP_KEYS` of them, and no key repeated.
 *
 * Both invariants were already enforced at the two outer boundaries —
 * `sanitizeGroupingByColumns` refuses a URL carrying either, and the server's
 * `assertGroupKeys` refuses both before emitting SQL. The store was the odd one
 * out, and it is the boundary a published package exposes to a consumer writing
 * their own loader: without this, such a route seeds or applies a list the table
 * renders as grouped and the query then rejects, which is a 500 out of a state
 * `@lcabrera/ui` itself accepted.
 *
 * This is deliberately the **shape** question only. Whether a key names a real
 * column, whether that column is groupable, and whether the catalogue permits it
 * (ADR-058) are all questions this cannot answer — the store holds no columns
 * and no capability map — and they stay with `sanitizeGroupingByColumns` and the
 * server.
 *
 * It is a predicate rather than a refusal because its two callers refuse
 * differently: an *update* past the cap is `unchanged`, leaving the applied
 * grouping alone, while a *seed* past the cap has no prior state to leave alone
 * and can only answer no grouping. Sharing the question while keeping the
 * answers apart is what stops the two drifting.
 */
export const areGroupKeysLegal = (keys: readonly string[]) =>
  keys.length <= MAX_TABLE_GROUP_KEYS && new Set(keys).size === keys.length;
