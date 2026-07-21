export type ApiSuccessResponse<TData> = {
  readonly data: TData;
};

export type CountRow = {
  readonly count: string;
};

export type DbRow = Readonly<Record<string, unknown>>;

export type DbSanityResult = {
  readonly isHealthy: boolean;
  readonly issues: readonly string[];
  readonly tableCounts: Readonly<Record<string, number | undefined>>;
};

/**
 * Re-exported rather than re-declared: `@lcabrera/server` owns this wire
 * contract, and the client half (`fetchDistinctValues`) validates responses
 * against it. Two copies of a shape that has to match across the wire is a
 * silent-drift hazard, not a convenience.
 */
export type { DistinctValuesResponse } from '@lcabrera/api/distinct/distinct.types';

export type PaginatedResponse<TData> = {
  readonly data: readonly TData[];
  readonly hasMore: boolean;
  readonly total: number;
};

export type PaginationArgs = {
  readonly limit: number;
  readonly skip: number;
};

export type Queryable = {
  readonly query: <TRow extends DbRow = DbRow>(
    query: string,
    params?: readonly QueryValue[],
  ) => Promise<QueryResult<TRow>>;
};

export type QueryResult<TRow extends DbRow = DbRow> = {
  readonly rowCount: null | number;
  readonly rows: readonly TRow[];
};

export type QueryValue = boolean | Date | null | number | string;

export type SortDirection = 'asc' | 'desc';

export type SortRule = {
  readonly columnKey: string;
  readonly direction: SortDirection;
};
