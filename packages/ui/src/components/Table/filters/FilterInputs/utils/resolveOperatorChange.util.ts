import type { TableColumnDataType } from '@lcabrera/ui/components/Table/Table.types';
import type {
  ColumnFilter,
  OperatorType,
} from '@lcabrera/ui/types/filterOperators.types';

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
  if (dataType === 'currency' || dataType === 'number') {
    return resolveNumberOperatorChange({ filter, operator });
  }

  if (dataType === 'date') {
    return resolveDateOperatorChange({ filter, operator });
  }

  return resolveTextOperatorChange({ filter, operator });
};
