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

export const resolveOperatorChange = ({
  dataType,
  filter,
  operator,
}: ResolveOperatorChangeArgs) => {
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
