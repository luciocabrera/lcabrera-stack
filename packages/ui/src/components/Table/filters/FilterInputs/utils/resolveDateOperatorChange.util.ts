import type {
  ColumnFilter,
  DateOperatorType,
  OperatorType,
} from '#ui/types/filterOperators.types';

type ResolveDateOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

/**
 * Next filter draft for a date column: keep the drafted date (and the `between`
 * second date) when the existing filter is already a date filter, otherwise
 * seed an empty one.
 */
// Return annotation required: 'date' widens to string without the ColumnFilter
// contextual type.
export const resolveDateOperatorChange = ({
  filter,
  operator,
}: ResolveDateOperatorChangeArgs): ColumnFilter => {
  const previous = filter?.type === 'date' ? filter : undefined;

  return {
    ...previous,
    operator: operator as DateOperatorType,
    type: 'date',
    value: previous?.value ?? '',
  };
};
