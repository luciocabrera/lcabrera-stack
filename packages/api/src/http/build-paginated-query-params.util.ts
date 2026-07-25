type BuildPaginatedQueryParamsArgs = {
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
  readonly sorting?: readonly {
    readonly columnKey: PropertyKey;
    readonly direction?: 'asc' | 'desc';
  }[];
};

/**
 * Build pagination query params (`limit`, `skip`, optional `sort`, `filter` and
 * `cursor`) shared by the table service paginated fetchers.
 * @param args - Pagination window plus optional sorting, filter and cursor payloads.
 * @returns A `URLSearchParams` instance ready to append to a paginated endpoint.
 */
export const buildPaginatedQueryParams = ({
  cursor,
  filter,
  limit,
  skip,
  sorting,
}: BuildPaginatedQueryParamsArgs) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  });

  if (sorting && sorting.length > 0) {
    params.append('sort', JSON.stringify(sorting));
  }

  if (cursor && cursor.length > 0) {
    params.append('cursor', JSON.stringify(cursor));
  }

  if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
    params.append('filter', JSON.stringify(filter));
  }

  return params;
};
