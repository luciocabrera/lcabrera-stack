import type { SelectFilter } from '@/components/Table';

export type SelectFilterInputProps = {
  filter: null | SelectFilter | undefined;
  onChange: (filter: null | SelectFilter | undefined) => void;
  options: string[];
};
