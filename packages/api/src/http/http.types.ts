/**
 * What a fetcher built by `createPaginatedFetcher` accepts: the query itself plus the
 * per-call concerns the factory cannot know statically.
 */
export type PaginatedFetchArgs = PaginatedQuery & {
  /** SSR only; omit in the browser, where the origin comes from the document. */
  readonly requestUrl?: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

export type PaginatedQuery = {
  /** Sort-key tuple of the last row loaded, in `sorting` order. */
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
