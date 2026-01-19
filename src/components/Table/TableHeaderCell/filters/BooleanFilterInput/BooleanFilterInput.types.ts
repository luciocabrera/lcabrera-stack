import type { BooleanFilter } from '../../../Table.types';

export type BooleanFilterInputProps = {
  filter: BooleanFilter | null | undefined;
  onChange: (filter: BooleanFilter | null | undefined) => void;
};
