import type { DateFilter } from '../../../Table.types';

export type DateFilterInputProps = {
  filter: DateFilter | undefined;
  onChange: (filter: DateFilter | undefined) => void;
};
