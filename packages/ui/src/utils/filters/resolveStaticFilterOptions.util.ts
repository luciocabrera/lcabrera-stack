import type {
  FilterOptionsResponse,
  StaticFilterOptionsDescriptor,
} from '#ui/components/Table/Table.types';
import type { Pagination } from '#ui/types/ui.types';

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
