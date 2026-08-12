import { groupingCodec } from './groupingCodec.util';

/**
 * Read the compact `grouping` URL param back into a list of group keys.
 *
 * Only the envelope is closed here — the keys are still arbitrary strings, and
 * nothing in this step checks them against a table's real columns. That is
 * `sanitizeGroupingByColumns`'s job in the loader path, and the server's
 * `assertGroupKeys` behind it; the two together are why an unusable key never
 * reaches SQL as an identifier.
 */
export const deserializeGroupingFromURL = (param: string) =>
  groupingCodec.deserialize(param).keys;
