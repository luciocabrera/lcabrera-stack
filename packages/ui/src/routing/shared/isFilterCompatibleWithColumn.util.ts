import type { TableColumn } from '#ui/components/Table';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

type IsFilterCompatibleWithColumnArgs<TData extends Record<string, unknown>> = {
  readonly column: TableColumn<TData>;
  readonly filter: ColumnFilter;
};

/**
 * Emptiness is not a comparison, so there is no type it fails to make sense for — and this
 * function's answer is load-bearing in one direction only: a `false` here drops the filter
 * from a URL silently, so a missing arm reads to a user as a link that opened on the wrong
 * rows.
 */
export const isFilterCompatibleWithColumn = <
  TData extends Record<string, unknown>,
>({
  column,
  filter,
}: IsFilterCompatibleWithColumnArgs<TData>) => {
  if (filter.type === 'empty') return true;

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
