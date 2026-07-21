import type {
  DistinctFilterOptionsDescriptor,
  FilterOptionsResponse,
} from '@repo/ui/components/Table/Table.types';
import type { Pagination } from '@repo/ui/types/ui.types';

import { fetchDistinctValues } from '@repo/api/distinct/fetch-distinct-values.util';

import { getFilterOptionsBaseUrl } from './getFilterOptionsBaseUrl.util';

/**
 * Executor for `kind: 'distinct'` descriptors: fetches one page of distinct
 * values through the transport-resolved endpoint using the descriptor's
 * baked params (skip→offset mapping preserved from the legacy factory).
 * Returns the `{ onLoadMore, dataSelector, dataTotalSelector }` contract
 * consumed by the filter fetch chain.
 */
export const resolveDistinctFilterOptions = (
  descriptor: DistinctFilterOptionsDescriptor,
) => ({
  dataSelector: (response: FilterOptionsResponse) => response.values,
  dataTotalSelector: (response: FilterOptionsResponse) =>
    response.hasMore ? Infinity : response.values.length,
  onLoadMore: async ({ limit, skip }: Pagination) => {
    const page = await fetchDistinctValues({
      baseUrl: getFilterOptionsBaseUrl(descriptor.transport),
      columnName: descriptor.params.columnName,
      limit,
      offset: skip,
      schemaName: descriptor.params.schemaName,
      tableName: descriptor.params.tableName,
    });

    return { hasMore: page.hasMore, values: [...page.values] };
  },
});
