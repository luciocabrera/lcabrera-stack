import type { TableDataState } from "@/components/Table/Table.types";

import { useStore } from "@/hooks";

import type { TableDataContextValue, TableDataProviderProps } from "./TableDataContext.types.ts";

import { TableDataContext } from "./TableDataContext.context.ts";
import { getInitialDataState } from "./utils/index.ts";

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
}: TableDataProviderProps<TData>) => {
  const dataStore = useStore<TableDataState<TData>>(getInitialDataState<TData>({ ...dataState }));

  const value = {
    dataStore,
  } as TableDataContextValue;

  return <TableDataContext value={value}>{children}</TableDataContext>;
};
