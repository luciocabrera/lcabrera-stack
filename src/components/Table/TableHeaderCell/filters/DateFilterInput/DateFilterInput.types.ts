import type { DateFilter } from '../../../Table.types';

export type DateFilterInputProps = {
  filter: DateFilter | null | undefined;
  onChange: (filter: DateFilter | null | undefined) => void;
};
