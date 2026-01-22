import type { TextFilter } from '@/types/filterOperators.types';

export type TextFilterInputProps = {
  filter?: TextFilter | undefined;
  onChange: (filter?: TextFilter) => void;
  /** The operator is now controlled by FilterInputs */
  operator: TextFilter['operator'];
};
