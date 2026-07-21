import type {
  ColumnFilter,
  NumberOperatorType,
  OperatorType,
} from '@lcabrera/ui/types/filterOperators.types';

type ResolveNumberOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

/**
 * Next filter draft for a number/currency column: keep the drafted value (and
 * the `between` second value) when the existing filter is already a number
 * filter, otherwise seed an empty one.
 */
// Return annotation required: 'number' widens to string without the
// ColumnFilter contextual type.
export const resolveNumberOperatorChange = ({
  filter,
  operator,
}: ResolveNumberOperatorChangeArgs): ColumnFilter => {
  const previous = filter?.type === 'number' ? filter : undefined;

  return {
    ...previous,
    operator: operator as NumberOperatorType,
    type: 'number',
    value: previous?.value,
  };
};
