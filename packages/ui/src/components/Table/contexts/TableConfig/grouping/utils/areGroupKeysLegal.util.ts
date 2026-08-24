import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

/**
 * Whether a group-key list is a legal **shape** for a grouping: no more than
 * `MAX_TABLE_GROUP_KEYS` of them, and no key repeated.
 * Both invariants were already enforced at the two outer boundaries —
 * `sanitizeGroupingByColumns` refuses a URL carrying either, and the server's
 * `assertGroupKeys` refuses both before emitting SQL.
 */
export const areGroupKeysLegal = (keys: readonly string[]) =>
  keys.length <= MAX_TABLE_GROUP_KEYS && new Set(keys).size === keys.length;
