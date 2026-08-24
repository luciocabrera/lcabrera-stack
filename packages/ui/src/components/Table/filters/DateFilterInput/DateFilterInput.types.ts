import type { DateFilter } from '#ui/types/filterOperators.types';

export type DateFilterInputProps = {
  readonly columnKey: string;
  readonly filter: DateFilter | undefined;
  readonly onChange: (filter?: DateFilter) => void;
  readonly operator: DateFilter['operator'];
};

export type UpdateDateFilterArgs = {
  readonly end: string;
  readonly op: DateFilter['operator'];
  readonly val: string;
};
