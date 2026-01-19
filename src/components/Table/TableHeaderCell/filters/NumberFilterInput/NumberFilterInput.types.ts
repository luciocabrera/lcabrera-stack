import type { NumberFilter } from '../../../Table.types';

export type NumberFilterInputProps = {
  filter: null | NumberFilter | undefined;
  onChange: (filter: null | NumberFilter | undefined) => void;
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
