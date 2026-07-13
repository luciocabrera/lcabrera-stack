import type {
  FilterOptionsResponse,
  StaticFilterOptionsDescriptor,
} from '@repo/ui/components/Table/Table.types';
import type { Pagination } from '@repo/ui/types/ui.types';

/**
 * Executor for `kind: 'static'` descriptors: serves pages by slicing the
 * baked values client-side (no network). Returns the
 * `{ onLoadMore, dataSelector, dataTotalSelector }` contract consumed by
 * the filter fetch chain; total convention: `hasMore ? Infinity : length`.
 */
export const resolveStaticFilterOptions = (
  descriptor: StaticFilterOptionsDescriptor,
) => ({
  dataSelector: (response: FilterOptionsResponse) => response.values,
  dataTotalSelector: (response: FilterOptionsResponse) =>
    response.hasMore ? Infinity : response.values.length,
  onLoadMore: ({ limit, skip }: Pagination) =>
    Promise.resolve({
      hasMore: skip + limit < descriptor.values.length,
      values: descriptor.values.slice(skip, skip + limit),
    }),
});
