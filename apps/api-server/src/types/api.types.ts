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

export type DistinctValuesResponse = {
  readonly hasMore: boolean;
  readonly values: readonly string[];
};

export type PaginatedResponse<TData> = {
  readonly data: readonly TData[];
  readonly hasMore: boolean;
  readonly total: number;
};

export type PaginationArgs = {
  readonly limit: number;
  readonly skip: number;
};

export type QueryValue = boolean | Date | null | number | string;

export type SortDirection = "asc" | "desc";

export type SortRule = {
  readonly columnKey: string;
  readonly direction: SortDirection;
};
