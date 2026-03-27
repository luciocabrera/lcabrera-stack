import type { StyleXStyles } from "@stylexjs/stylex";
import type { ComponentPropsWithoutRef } from "react";

export type TableRowProps = ComponentPropsWithoutRef<"div"> & {
  readonly customStylex?: StyleXStyles;
  readonly isHeader?: boolean;
  readonly isStriped?: boolean;
};
