import type { ColumnFilter } from '@/types/filterOperators.types';

import type { CompactFilterValue } from './serializeFilter.types';
import { serializeBooleanFilter } from './serializeBooleanFilter.util';
import { serializeDateFilter } from './serializeDateFilter.util';
import { serializeNumberFilter } from './serializeNumberFilter.util';
import { serializeSelectFilter } from './serializeSelectFilter.util';
import { serializeTextFilter } from './serializeTextFilter.util';

type SerializeFilterArgs = {
  readonly filter: ColumnFilter;
};

/**
 * Dispatch to the appropriate per-type serializer and return a compact
 * URL-friendly representation of a single column filter.
 */
export const serializeFilter = ({
  filter,
}: SerializeFilterArgs): CompactFilterValue => {
  switch (filter.type) {
    case 'boolean': {
      return serializeBooleanFilter({ filter });
    }
    case 'date': {
      return serializeDateFilter({ filter });
    }
    case 'multiSelect':
    case 'select': {
      return serializeSelectFilter({ filter });
    }
    case 'number': {
      return serializeNumberFilter({ filter });
    }
    case 'text': {
      return serializeTextFilter({ filter });
    }
  }
};
