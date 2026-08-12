/**
 * Compact wire form of the `grouping` param: `{"keys":["order_status"]}`. Plain
 * JSON like `sorting` and `filters`, with no transport layer (ADR-061).
 *
 * The **envelope** is closed here — `keys` is the only member the narrowing
 * admits, and every element must be a string. Which columns are legal group
 * keys is a question about a route, not about a URL, so it is answered later by
 * `sanitizeGroupingByColumns`; both refuse whole rather than per key.
 */
export type CompactGrouping = {
  readonly keys: readonly string[];
};

/**
 * Compact wire form of the `sorting` param: `{"name":"asc"}`. The direction
 * vocabulary is closed here so the codec's narrowing has something to check a
 * URL-supplied token against.
 */
export type CompactSorting = Record<string, 'asc' | 'desc'>;
