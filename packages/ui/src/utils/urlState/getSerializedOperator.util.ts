import { OPERATOR_TO_SHORT } from '@repo/ui/constants/filterOperators.constants';

export const getSerializedOperator = (operator: string): string =>
  OPERATOR_TO_SHORT[operator] ?? operator;
