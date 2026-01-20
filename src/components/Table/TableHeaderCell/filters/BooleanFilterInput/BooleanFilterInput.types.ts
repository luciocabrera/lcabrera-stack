import type { BooleanFilter } from '../../../Table.types';

export type BooleanFilterInputProps = {
  filter: BooleanFilter | undefined;
  onChange: (filter: BooleanFilter | undefined) => void;
};
