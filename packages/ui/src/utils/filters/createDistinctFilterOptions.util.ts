import type { FilterOptionsResponse } from '@repo/ui/components/Table/Table.types';

type CreateDistinctFilterOptionsArgs<TData extends Record<string, unknown>> = {
  readonly columnName: keyof TData;
  readonly fetchDistinctValues: (
    args: FetchDistinctValuesArgs<TData>,
  ) => Promise<FilterOptionsResponse>;
};

type FetchDistinctValuesArgs<TData> = {
  readonly columnName: keyof TData;
  readonly limit: number;
  readonly offset: number;
};

/**
 * Adapts a distinct-values API to the table filter options contract.
 */
export const createDistinctFilterOptions = <
  TData extends Record<string, unknown>,
>({
  columnName,
  fetchDistinctValues,
}: CreateDistinctFilterOptionsArgs<TData>) => {
  return {
    fetchFilterOptions: async ({
      limit,
      skip,
    }: {
      readonly limit: number;
      readonly skip: number;
    }) =>
      fetchDistinctValues({
        columnName,
        limit,
        offset: skip,
      }),
    filterOptionsDataSelector: (response: FilterOptionsResponse): string[] =>
      response.values,
    filterOptionsDataTotalSelector: (response: FilterOptionsResponse): number =>
      response.hasMore ? Infinity : response.values.length,
  };
};
