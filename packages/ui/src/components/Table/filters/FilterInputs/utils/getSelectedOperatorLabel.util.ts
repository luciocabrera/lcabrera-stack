import type {
  ColumnFilter,
  OperatorOption,
  OperatorType,
} from '@repo/ui/types/filterOperators.types';

type GetSelectedOperatorLabelArgs = {
  readonly filter?: ColumnFilter;
  readonly operator: OperatorType;
  readonly operatorOptions: OperatorOption[];
};

export const getSelectedOperatorLabel = ({
  filter,
  operator,
  operatorOptions,
}: GetSelectedOperatorLabelArgs) => {
  if (!filter) return [];
  const match = operatorOptions.find((op) => op.value === operator);
  return match ? [match.label] : [];
};
