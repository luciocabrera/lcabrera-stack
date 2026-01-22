import type { NumberFilter } from '../../../Table.types';

export type NumberFilterInputProps = {
  filter: NumberFilter | undefined;
  onChange: (filter?: NumberFilter) => void;
  /** The operator is now controlled by FilterInputs */
  operator: NumberFilter['operator'];
};

export type UpdateFilterArgs = {
  maxVal: '' | number;
  op:
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals';
  val: '' | number;
};
