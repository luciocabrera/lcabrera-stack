import type {
  ColumnFilter,
  NumberOperatorType,
  OperatorType,
} from '#ui/types/filterOperators.types';

type ResolveNumberOperatorChangeArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
};

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
