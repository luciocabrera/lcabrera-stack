import type { TableColumnsState, TableMetaState } from "@/components/Table/Table.types";

import { useStore } from "@/hooks";

import type {
  TableConfigContextValue,
  TableConfigProviderProps,
} from "./TableConfigContext.types.ts";

import { TableConfigContext } from "./TableConfigContext.context.ts";
import { getInitialColumnsState, getInitialMetaState } from "./utils/index.ts";

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnsState,
  metaState,
}: TableConfigProviderProps<TData>) => {
  const columnsStore = useStore<TableColumnsState<TData>>(
    getInitialColumnsState<TData>({ ...columnsState }),
  );
  const metaStore = useStore<TableMetaState>(getInitialMetaState({ ...metaState }));

  const value = {
    columnsStore,
    metaStore,
  } as TableConfigContextValue;

  return <TableConfigContext value={value}>{children}</TableConfigContext>;
};
