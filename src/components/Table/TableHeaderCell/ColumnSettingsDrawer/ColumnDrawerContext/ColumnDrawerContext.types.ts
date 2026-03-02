import type {
  DataKey,
  TableColumnSettingsState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type ColumnDrawerContextValue = {
  /** Store managing column-related state */
  columnStore: TStore<ColumnDrawerState<unknown>>;
};

export type ColumnDrawerProviderProps<TData> = {
  children: React.ReactNode;
  columnKey: DataKey<TData>;
};

export type ColumnDrawerState<TData> = TableColumnSettingsState<TData> & {
  columnKey: DataKey<TData>;
};
