import type { NumberFilter } from '../../../Table.types';

export type NumberFilterInputProps = {
  filter: NumberFilter | undefined;
  onChange: (filter: NumberFilter | undefined) => void;
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
