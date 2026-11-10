import type { OperatorType } from '#ui/types/filterOperators.types';

type ShouldShowSelectListArgs = {
  readonly hasFetchableOptions: boolean;
  readonly operator: OperatorType;
};

export const shouldShowSelectList = ({
  hasFetchableOptions,
  operator,
}: ShouldShowSelectListArgs) =>
  hasFetchableOptions && (operator === 'equals' || operator === 'notEquals');
