import { groupingCodec } from './groupingCodec.util';

/**
 * Serialize the active group keys to the compact `grouping` URL param.
 *
 * Returns `undefined` for an empty key list so the caller leaves the param off
 * the URL entirely, the way `serializeSortingToURL` does for an unsorted table
 * — a `grouping={"keys":[]}` in a shared link would say "grouping considered
 * and switched off", which is not a state this table has.
 */
export const serializeGroupingToURL = (keys: readonly string[]) =>
  keys.length === 0 ? undefined : groupingCodec.serialize({ keys });
