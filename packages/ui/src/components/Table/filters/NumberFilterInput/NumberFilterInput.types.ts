import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { NumberFilter } from '@repo/ui/types/filterOperators.types';

export type NumberFilterInputProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly filter: NumberFilter | undefined;
  readonly onChange: (filter?: NumberFilter) => void;
  /** The operator is now controlled by FilterInputs */
  readonly operator: NumberFilter['operator'];
};

export type UpdateFilterArgs = {
  readonly maxVal: '' | number;
  readonly op:
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals';
  readonly val: '' | number;
};
