import * as stylex from "@stylexjs/stylex";

import { spacing } from "@/design-system/tokens/base.stylex";
import { colors } from "@/design-system/tokens/colors.stylex";

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    paddingBlock: spacing.lg,
    paddingInline: spacing.lg,
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
  },
  titleSection: {
    gap: spacing.md,
    alignItems: "center",
    display: "flex",
  },
  icon: {
    alignItems: "center",
    color: colors.textSecondary,
    display: "flex",
    fontSize: "1.5rem",
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  actions: {
    gap: spacing.sm,
    alignItems: "center",
    display: "flex",
  },
});
