/**
 * Compact wire form of the `sorting` param: `{"name":"asc"}`. The direction
 * vocabulary is closed here so the codec's narrowing has something to check a
 * URL-supplied token against.
 */
export type CompactSorting = Record<string, 'asc' | 'desc'>;
