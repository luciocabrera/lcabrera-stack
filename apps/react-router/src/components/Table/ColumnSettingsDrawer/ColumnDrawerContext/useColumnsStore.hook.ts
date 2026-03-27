import { useSyncExternalStore } from "react";

import type { ColumnDrawerState } from "./ColumnDrawerContext.types.ts";

import { useColumnDrawerContextValue } from "./useColumnDrawerContextValue.hook.ts";

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: ColumnDrawerState<TData>) => TSelected,
) => {
  const { columnStore } = useColumnDrawerContextValue();

  const state = useSyncExternalStore(
    columnStore.subscribe,
    () => selector(columnStore.get() as ColumnDrawerState<TData>),
    () => selector(columnStore.getServerSnapshot() as ColumnDrawerState<TData>),
  );

  return state;
};
