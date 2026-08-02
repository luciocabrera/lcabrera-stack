/**
 * What a fetcher built by `createPaginatedFetcher` accepts: the query itself
 * plus the per-call concerns the factory cannot know statically.
 *
 * `requestUrl` is the incoming SSR request's URL, handed to the fetcher's
 * `resolveBaseUrl` so a loader reaches the API host by absolute URL. Omit it in
 * the browser, where the same resolver derives the origin from the document.
 */
export type PaginatedFetchArgs = PaginatedQuery & {
  readonly requestUrl?: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/**
 * A paginated read, independent of transport. Deliberately structural rather
 * than typed against `@lcabrera/ui`'s table state: this package is browser-safe
 * and must not depend on the component library that happens to produce most of
 * these values.
 *
 * `cursor` and `filter` are optional because endpoint capability varies — an
 * offset-only endpoint receives neither, and `buildPaginatedQueryParams` omits
 * whatever is absent rather than sending an empty parameter.
 */
export type PaginatedQuery = {
  /**
   * Keyset cursor — the sort-key tuple of the last row already loaded, in
   * `sorting` order — for an endpoint that can seek past it rather than count
   * `skip` rows. `skip` is still sent alongside: it remains the rows-loaded
   * count, and an endpoint that does not understand cursors keeps working.
   */
  readonly cursor?: readonly unknown[];
  readonly filter?: unknown;
  readonly limit: number;
  readonly skip: number;
  readonly sorting?: readonly PaginatedSort[];
};

/** One column's sort direction, structurally compatible with a table's sorting state. */
export type PaginatedSort = {
  readonly columnKey: PropertyKey;
  readonly direction?: 'asc' | 'desc';
};
