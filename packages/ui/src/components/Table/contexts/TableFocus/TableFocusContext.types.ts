import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableFocusContextValue = {
  readonly focusStore: TStore<TableFocusState>;
};

export type TableFocusProviderProps = {
  readonly children: React.ReactNode;
};
