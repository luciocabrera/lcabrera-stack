import type { BooleanFilter } from '@/types/filterOperators.types';

export type BooleanFilterInputProps = {
  filter: BooleanFilter | undefined;
  onChange: (filter: BooleanFilter | undefined) => void;
};
