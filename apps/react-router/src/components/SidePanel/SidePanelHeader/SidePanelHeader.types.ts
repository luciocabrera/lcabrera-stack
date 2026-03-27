import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type SidePanelHeaderProps = ComponentPropsWithoutRef<"div"> & {
  readonly actions?: ReactNode;
};
