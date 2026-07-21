/** One page of distinct values for a column, as served by a distinct-values endpoint. */
export type DistinctValuesResponse = {
  readonly hasMore: boolean;
  readonly values: readonly string[];
};
