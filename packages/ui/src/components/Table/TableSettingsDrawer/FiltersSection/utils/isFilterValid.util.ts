import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { isDateFilterValid } from './isDateFilterValid.util';
import { isNumberFilterValid } from './isNumberFilterValid.util';
import { isSelectFilterValid } from './isSelectFilterValid.util';
import { isTextFilterValid } from './isTextFilterValid.util';

/** Validates a filter to ensure required fields are populated */
export const isFilterValid = (filter?: ColumnFilter | null): boolean => {
  if (!filter) return false;

  switch (filter.type) {
    case 'boolean': {
      return true;
    }
    case 'date': {
      return isDateFilterValid(filter);
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
