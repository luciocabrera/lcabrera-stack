import type {
  ColumnFilter,
  OperatorType,
  TextOperatorType,
} from '#ui/types/filterOperators.types';

import { getDraftedText } from './getDraftedText.util';

type ResolveTextOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

export const resolveTextOperatorChange = ({
  filter,
  operator,
}: ResolveTextOperatorChangeArgs): ColumnFilter => {
  const isSelectFilter =
    filter?.type === 'multiSelect' || filter?.type === 'select';

  if (isSelectFilter && (operator === 'equals' || operator === 'notEquals')) {
    return { ...filter, operator };
  }

  return {
    operator: operator as TextOperatorType,
    type: 'text',
    value: getDraftedText(filter),
  };
};
