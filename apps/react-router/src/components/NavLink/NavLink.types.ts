import type { ReactNode } from "react";
import type { NavLinkProps as RouterNavLinkProps } from "react-router";

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemWidth,
} from "@/types/design-system.types";

export type NavLinkProps = Omit<RouterNavLinkProps, "children"> & {
  readonly children: ReactNode;
  readonly color?: DesignSystemColor;
  readonly icon?: ReactNode;
  readonly isActive?: boolean;
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
  readonly width?: DesignSystemWidth;
};
