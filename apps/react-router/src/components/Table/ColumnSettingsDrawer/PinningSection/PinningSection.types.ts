import type { DataKey } from '@/components/Table/Table.types';

export type PinningSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isBussy?: boolean;
};
