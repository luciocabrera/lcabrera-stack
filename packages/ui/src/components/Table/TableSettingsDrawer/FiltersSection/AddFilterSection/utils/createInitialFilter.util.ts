import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

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
