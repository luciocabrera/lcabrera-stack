import type { DataKey } from '@repo/ui/components/Table/Table.types';

export type DetailItem = {
  readonly isBadge?: boolean;
  readonly isMono?: boolean;
  readonly label: string;
  readonly value: string;
};

export type DetailsSectionProps<TData> = {
  readonly columnKey: DataKey<TData>;
};
