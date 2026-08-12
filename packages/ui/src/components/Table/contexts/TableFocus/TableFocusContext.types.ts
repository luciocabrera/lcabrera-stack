import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableFocusContextValue = {
  /** Store holding the grid's roving focus target (ADR-062). */
  readonly focusStore: TStore<TableFocusState>;
};

export type TableFocusProviderProps = {
  readonly children: React.ReactNode;
};
