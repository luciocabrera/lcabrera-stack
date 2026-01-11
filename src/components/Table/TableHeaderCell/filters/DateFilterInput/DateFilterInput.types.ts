import type { DateFilter } from '@/components/Table';

export type DateFilterInputProps = {
  filter: DateFilter | null | undefined;
  onChange: (filter: DateFilter | null | undefined) => void;
};
