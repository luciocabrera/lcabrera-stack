import type { FilterOptionsDescriptor } from '#ui/components/Table/Table.types';

import { resolveDistinctFilterOptions } from './resolveDistinctFilterOptions.util';
import { resolveStaticFilterOptions } from './resolveStaticFilterOptions.util';

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
