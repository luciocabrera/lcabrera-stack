import type { DataKey } from '@/components/Table/Table.types';

export type DetailItem = {
  isBadge?: boolean;
  isMono?: boolean;
  label: string;
  value: string;
};

export type DetailsSectionProps<TData> = {
  columnKey: DataKey<TData>;
};
