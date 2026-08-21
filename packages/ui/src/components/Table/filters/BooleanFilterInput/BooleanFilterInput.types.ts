import type {
  BooleanFilter,
  EmptyFilter,
} from '#ui/types/filterOperators.types';

export type BooleanFilterInputProps = {
  readonly filter: BooleanFilter | EmptyFilter | undefined;
  readonly onChange: (filter?: BooleanFilter | EmptyFilter) => void;
};
