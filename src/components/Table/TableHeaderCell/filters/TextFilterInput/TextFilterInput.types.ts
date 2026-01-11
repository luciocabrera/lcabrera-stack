import type { TextFilter } from '@/components/Table';

export type TextFilterInputProps = {
  filter: null | TextFilter | undefined;
  onChange: (filter: null | TextFilter | undefined) => void;
};
