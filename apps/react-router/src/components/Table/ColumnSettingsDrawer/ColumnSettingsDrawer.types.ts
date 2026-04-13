import type { DataKey } from '../Table.types.ts';

export type ColumnSettingsDrawerProps<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
};
