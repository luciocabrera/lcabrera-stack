import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type {
  ColumnFilter,
  OperatorType,
} from '#ui/types/filterOperators.types';

import { resolveDateOperatorChange } from './resolveDateOperatorChange.util';
import { resolveNumberOperatorChange } from './resolveNumberOperatorChange.util';
import { resolveTextOperatorChange } from './resolveTextOperatorChange.util';

type ResolveOperatorChangeArgs = {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

/**
 * Build the next filter draft for an operator change: keep the existing
 * filter's drafted value and swap its operator, or seed a typed empty filter
 * when no compatible filter exists yet.
 *
 * The column's data type picks the filter family — matching `getOperatorOptions`,
 * which derives the offered operators from the same data type. Each family
 * rebuilds its own filter rather than spread-and-overriding a foreign one, so a
 * mismatched pair (`{ type: 'select', operator: 'contains' }`) cannot be
 * constructed; the old `as ColumnFilter` on the spread is what let it through.
 */
export const resolveOperatorChange = ({
  dataType,
  filter,
  operator,
}: ResolveOperatorChangeArgs) => {
  // Ahead of the data-type dispatch, because emptiness is not a comparison and
  // has no family: the same filter answers it for a date, a number and a text
  // column. Any drafted value is dropped with the old filter, which is correct
  // — this operator takes none, and keeping one would leave a value in the
  // state that nothing reads and the URL would not carry.
  if (operator === 'isEmpty' || operator === 'isNotEmpty') {
    return { operator, type: 'empty' } as const;
  }

  if (dataType === 'currency' || dataType === 'number') {
    return resolveNumberOperatorChange({ filter, operator });
  }

  if (dataType === 'date') {
    return resolveDateOperatorChange({ filter, operator });
  }

  return resolveTextOperatorChange({ filter, operator });
};
