import { useStore } from "@/hooks";

import type {
  ColumnOrderSectionModalsState,
  ColumnOrderSectionProviderProps,
} from "./ColumnOrderSectionContext.types.ts";

import { ColumnOrderSectionContext } from "./ColumnOrderSectionContext.context.ts";
import { getInitialModalsState } from "./utils/index.ts";

export const ColumnOrderSectionProvider = ({ children }: ColumnOrderSectionProviderProps) => {
  const modalsStore = useStore<ColumnOrderSectionModalsState>(getInitialModalsState());

  return <ColumnOrderSectionContext value={{ modalsStore }}>{children}</ColumnOrderSectionContext>;
};
