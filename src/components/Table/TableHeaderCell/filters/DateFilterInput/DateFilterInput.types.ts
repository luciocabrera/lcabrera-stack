import type { DateFilter } from '@/types/filterOperators.types';

export type DateFilterInputProps = {
  columnKey: string;
  filter: DateFilter | undefined;
  onChange: (filter?: DateFilter) => void;
  /** The operator is now controlled by FilterInputs */
  operator: DateFilter['operator'];
};

export type UpdateDateFilterArgs = {
  end: string;
  op: DateFilter['operator'];
  val: string;
};
