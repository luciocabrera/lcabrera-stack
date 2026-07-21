import type {
  DistinctFilterOptionsDescriptor,
  FilterOptionsResponse,
} from '@lcabrera/ui/components/Table/Table.types';
import type { Pagination } from '@lcabrera/ui/types/ui.types';

import { fetchDistinctValues } from '@lcabrera/api/distinct/fetch-distinct-values.util';
import { FILTER_OPTIONS_TIMEOUT_MS } from '@lcabrera/ui/components/Table/Table.constants';

import { getFilterOptionsBaseUrl } from './getFilterOptionsBaseUrl.util';

/**
 * Executor for `kind: 'distinct'` descriptors: fetches one page of distinct
 * values through the transport-resolved endpoint using the descriptor's
 * baked params (skip→offset mapping preserved from the legacy factory).
 * Returns the `{ onLoadMore, dataSelector, dataTotalSelector }` contract
 * consumed by the filter fetch chain.
 *
 * Bounded by `FILTER_OPTIONS_TIMEOUT_MS` because this is the only descriptor
 * kind that goes over the network. The fetch chain's concurrency guard treats
 * an unsettled request as still in progress forever, so a hung endpoint would
 * otherwise leave the dropdown permanently unable to load another page. The
 * timeout converts that silence into a rejection the existing error path
 * already knows how to clear and report.
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
      timeoutMs: FILTER_OPTIONS_TIMEOUT_MS,
    });

    return { hasMore: page.hasMore, values: [...page.values] };
  },
});
