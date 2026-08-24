/**
 * What a fetcher built by `createPaginatedFetcher` accepts: the query itself plus the
 * per-call concerns the factory cannot know statically.
 */
export type PaginatedFetchArgs = PaginatedQuery & {
  /**
   * Incoming SSR request URL, handed to `resolveBaseUrl` so a loader reaches
   * the API host by absolute URL. Omit it in the browser, where the same
   * resolver derives the origin from the document.
   */
  readonly requestUrl?: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/**
 * Deliberately structural rather than typed against `@lcabrera/ui`'s table state: this
 * package is browser-safe and must not depend on the component library that happens to
 * produce most of these values.
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

export type PaginatedSort = {
  readonly columnKey: PropertyKey;
  readonly direction?: 'asc' | 'desc';
};
