import { fetchDistinctValues } from '@lcabrera/api/distinct/fetch-distinct-values.util';

import type {
  DistinctFilterOptionsDescriptor,
  FilterOptionsResponse,
} from '#ui/components/Table/Table.types';
import type { Pagination } from '#ui/types/ui.types';

import { FILTER_OPTIONS_TIMEOUT_MS } from '#ui/components/Table/Table.constants';

import { getFilterOptionsBaseUrl } from './getFilterOptionsBaseUrl.util';

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
