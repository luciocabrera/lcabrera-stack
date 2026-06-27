import type { TableColumn } from '@/components/Table';
import type { ColumnFilter } from '@/types/filterOperators.types';

type IsFilterCompatibleWithColumnArgs<TData extends Record<string, unknown>> = {
  readonly column: TableColumn<TData>;
  readonly filter: ColumnFilter;
};

/**
 * Returns true when the filter kind is compatible with the column's declared data type.
 * Used to sanitize URL filter params before they reach the API layer.
 */
export const isFilterCompatibleWithColumn = <
  TData extends Record<string, unknown>,
>({
  column,
  filter,
}: IsFilterCompatibleWithColumnArgs<TData>): boolean => {
  switch (column.dataType) {
    case 'boolean': {
      return filter.type === 'boolean';
    }
    case 'currency':
    case 'number': {
      return filter.type === 'number';
    }
    case 'date': {
      return filter.type === 'date';
    }
    case 'string':
    case undefined: {
      return ['multiSelect', 'select', 'text'].includes(filter.type);
    }
    default: {
      return false;
    }
  }
};
