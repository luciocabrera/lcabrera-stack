import type { BooleanFilter } from '@repo/ui/types/filterOperators.types';

export type BooleanFilterInputProps = {
  readonly filter: BooleanFilter | undefined;
  readonly onChange: (filter?: BooleanFilter) => void;
};
