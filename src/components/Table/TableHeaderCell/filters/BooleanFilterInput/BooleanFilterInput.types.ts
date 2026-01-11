import type { BooleanFilter } from '@/components/Table';

export type BooleanFilterInputProps = {
  filter: BooleanFilter | null | undefined;
  onChange: (filter: BooleanFilter | null | undefined) => void;
};
