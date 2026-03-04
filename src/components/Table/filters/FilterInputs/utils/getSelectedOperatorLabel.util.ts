import type {
  ColumnFilter,
  OperatorOption,
  OperatorType,
} from '@/types/filterOperators.types';

type GetSelectedOperatorLabelArgs = {
  filter?: ColumnFilter;
  operator: OperatorType;
  operatorOptions: OperatorOption[];
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
