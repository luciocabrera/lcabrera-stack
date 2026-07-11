import type { DataKey } from '@repo/ui/components/Table/Table.types';

/**
 * ColumnSettingsDrawerHeader component props
 */
export type ColumnSettingsDrawerHeaderProps<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
