import type { FilterOptionsDescriptor } from '#ui/components/Table/Table.types';

import { resolveDistinctFilterOptions } from './resolveDistinctFilterOptions.util';
import { resolveStaticFilterOptions } from './resolveStaticFilterOptions.util';

/**
 * The client-side "tool" for serializable filter-options descriptors:
 * dispatches on `descriptor.kind` to the matching executor and returns the
 * `{ onLoadMore, dataSelector, dataTotalSelector }` contract the filter
 * fetch chain (`useFetchFilterData`) consumes. Adding a descriptor kind =
 * a new executor util + a case here.
 */
export const resolveFilterOptionsDescriptor = (
  descriptor: FilterOptionsDescriptor,
) => {
  switch (descriptor.kind) {
    case 'distinct': {
      return resolveDistinctFilterOptions(descriptor);
    }
    case 'static': {
      return resolveStaticFilterOptions(descriptor);
    }
  }
};
