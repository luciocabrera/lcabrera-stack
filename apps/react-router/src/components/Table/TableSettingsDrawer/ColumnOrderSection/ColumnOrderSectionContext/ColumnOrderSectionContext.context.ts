import { createContext } from "react";

import type { ColumnOrderSectionContextValue } from "./ColumnOrderSectionContext.types.ts";

import { getInitialModalsState } from "./utils/index.ts";

export const ColumnOrderSectionContext = createContext<ColumnOrderSectionContextValue>({
  modalsStore: getInitialModalsState(),
} as unknown as ColumnOrderSectionContextValue);

ColumnOrderSectionContext.displayName = "ColumnOrderSectionContext";
