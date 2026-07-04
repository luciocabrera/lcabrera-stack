import type {
  FilterOptionsResponse,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

type StaticFilterOptions<TData> = Pick<
  TableColumn<TData>,
  | 'fetchFilterOptions'
  | 'filterOptionsDataSelector'
  | 'filterOptionsDataTotalSelector'
>;

/**
 * Creates fetchFilterOptions + selectors for a static list of values.
 * Use this when filter options are known at build time and don't require an API call.
 *
 * The static array is wrapped in a Promise to match the async fetcher contract,
 * supporting pagination (skip/limit) for consistency with server-fetched options.
 *
 * @example
 * ```ts
 * {
 *   dataType: 'string',
 *   ...createStaticFilterOptions(['Pending', 'Shipped', 'Delivered']),
 *   key: 'status',
 *   label: 'Status',
 * }
 * ```
 */
export const createStaticFilterOptions = <TData>(
  values: string[],
): StaticFilterOptions<TData> => ({
  fetchFilterOptions: ({
    limit,
    skip,
  }: {
    limit: number;
    skip: number;
  }): Promise<FilterOptionsResponse> => {
    const sliced = values.slice(skip, skip + limit);
    return Promise.resolve({
      hasMore: skip + limit < values.length,
      values: sliced,
    });
  },
  filterOptionsDataSelector: (response: FilterOptionsResponse) =>
    response.values,
  filterOptionsDataTotalSelector: (response: FilterOptionsResponse) =>
    response.hasMore ? Infinity : response.values.length,
});
