type BuildPaginatedQueryParamsArgs = {
  readonly filter?: unknown;
  readonly limit: number;
  readonly skip: number;
  readonly sorting?: readonly {
    readonly columnKey: PropertyKey;
    readonly direction?: 'asc' | 'desc';
  }[];
};

/**
 * Build offset-pagination query params (`limit`, `skip`, optional `sort` and
 * `filter`) shared by the table service paginated fetchers.
 * @param args - Pagination window plus optional sorting and filter payloads.
 * @returns A `URLSearchParams` instance ready to append to a paginated endpoint.
 */
export const buildPaginatedQueryParams = ({
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

  if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
    params.append('filter', JSON.stringify(filter));
  }

  return params;
};
