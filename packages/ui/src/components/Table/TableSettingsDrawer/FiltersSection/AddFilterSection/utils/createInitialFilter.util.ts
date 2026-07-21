import type { TableColumnDataType } from '@lcabrera/ui/components/Table/Table.types';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

/**
 * Builds the default draft filter for a newly added column based on its data
 * type: boolean → checked toggle, number/currency → equals 0, date → equals
 * with an empty ISO value, anything else → text equals with an empty value.
 */
export const createInitialFilter = (dataType?: TableColumnDataType) => {
  switch (dataType) {
    case 'boolean': {
      return { type: 'boolean', value: true } satisfies ColumnFilter;
    }
    case 'currency':
    case 'number': {
      return {
        operator: 'equals',
        type: 'number',
        value: 0,
      } satisfies ColumnFilter;
    }
    case 'date': {
      return {
        operator: 'equals',
        type: 'date',
        value: '',
      } satisfies ColumnFilter;
    }
    default: {
      return {
        operator: 'equals',
        type: 'text',
        value: '',
      } satisfies ColumnFilter;
    }
  }
};
