import type {
  ColumnFilter,
  DateOperatorType,
  OperatorType,
} from '#ui/types/filterOperators.types';

type ResolveDateOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

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
