import * as stylex from "@stylexjs/stylex";

import { borderRadius } from "@/design-system/tokens/base.stylex";
import { colors } from "@/design-system/tokens/colors.stylex";

export const tableRowStyles = stylex.create({
  base: {
    alignItems: "center",
    backgroundColor: colors.surfacePrimary,
    display: "flex",
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    minHeight: 0,
    width: "100%",
  },
  header: {
    padding: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    height: 40,
  },
  striped: {
    backgroundColor: { ":nth-child(even)": colors.backgroundSecondary },
  },
});
