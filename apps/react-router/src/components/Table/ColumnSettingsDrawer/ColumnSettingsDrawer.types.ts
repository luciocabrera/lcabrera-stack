import type { DataKey } from '../Table.types';

export type ColumnSettingsDrawerProps<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly isBusy?: boolean;
};
