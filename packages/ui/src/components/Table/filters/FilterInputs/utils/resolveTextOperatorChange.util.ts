import type {
  ColumnFilter,
  OperatorType,
  TextOperatorType,
} from '@repo/ui/types/filterOperators.types';

import { getDraftedText } from './getDraftedText.util';

type ResolveTextOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

/**
 * Next filter draft for a string column, which can hold either a text or a
 * select filter.
 *
 * A select filter only models `equals`/`notEquals` (`SelectFilter['operator']`),
 * and `TextOrSelectFilterInput` swaps to a text input for every other operator,
 * so the filter converts with it. Keeping `type: 'select'` while the operator
 * moved on left the stale selected values serializing as `equals` behind a text
 * input the user was typing into.
 */
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
