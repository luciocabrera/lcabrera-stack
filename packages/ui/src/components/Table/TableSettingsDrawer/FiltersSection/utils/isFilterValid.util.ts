import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { isDateFilterValid } from './isDateFilterValid.util';
import { isNumberFilterValid } from './isNumberFilterValid.util';
import { isSelectFilterValid } from './isSelectFilterValid.util';
import { isTextFilterValid } from './isTextFilterValid.util';

export const isFilterValid = (filter?: ColumnFilter | null) => {
  if (!filter) return false;

  switch (filter.type) {
    case 'boolean': {
      return true;
    }
    case 'date': {
      return isDateFilterValid(filter);
    }
    // Nothing left to populate: the operator is the whole filter. Falling to
    // the default would make it permanently invalid and silently undroppable
    // from the drawer's staged state.
    case 'empty': {
      return true;
    }
    case 'multiSelect':
    case 'select': {
      return isSelectFilterValid(filter);
    }
    case 'number': {
      return isNumberFilterValid(filter);
    }
    case 'text': {
      return isTextFilterValid(filter);
    }
    default: {
      return false;
    }
  }
};
