import type { DataKey } from '@repo/ui/components/Table/Table.types';

/**
 * ColumnSettingsDrawerBody component props
 */
export type ColumnSettingsDrawerBodyProps<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
