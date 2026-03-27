import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type SidePanelSectionHeaderProps = ComponentPropsWithoutRef<"div"> & {
  readonly title: string;
  readonly toolbar?: ReactNode;
};
