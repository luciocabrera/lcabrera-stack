import { createContext } from "react";

import type { TableConfigContextValue } from "./TableConfigContext.types.ts";

import { getInitialColumnsState, getInitialMetaState } from "./utils/index.ts";

export const TableConfigContext = createContext<TableConfigContextValue>({
  columnsStore: getInitialColumnsState({}),
  metaStore: getInitialMetaState({}),
} as unknown as TableConfigContextValue);

TableConfigContext.displayName = "TableConfigContext";
