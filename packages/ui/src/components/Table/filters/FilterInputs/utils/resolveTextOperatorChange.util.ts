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

// Return annotation required: 'text' widens to string without the ColumnFilter
// contextual type.
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
    // Carry the chosen option across so "equals alpha" becomes "contains alpha"
    // rather than silently emptying the filter the user just built.
    value: getDraftedText(filter),
  };
};
