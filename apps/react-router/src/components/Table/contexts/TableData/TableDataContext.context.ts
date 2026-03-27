import { createContext } from "react";

import type { TableDataContextValue } from "./TableDataContext.types.ts";

import { getInitialDataState } from "./utils/index.ts";

/**
 * Data context for sharing state across table components
 *
 * Uses external stores with useSyncExternalStore for granular updates.
 * Components can subscribe to specific slices of state via selector hooks.
 */
export const TableDataContext = createContext<TableDataContextValue>({
  dataStore: getInitialDataState<Record<string, unknown>>({}),
} as unknown as TableDataContextValue);

TableDataContext.displayName = "TableDataContext";
