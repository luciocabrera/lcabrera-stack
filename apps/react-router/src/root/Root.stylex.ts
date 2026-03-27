import * as stylex from "@stylexjs/stylex";

import { borderRadius, spacing, typography } from "@/design-system/tokens/base.stylex";
import { colors } from "@/design-system/tokens/colors.stylex";

export const styles = stylex.create({
  base: {
    overflow: "hidden",
    transition: "background-color 0.3s ease, color 0.3s ease",
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    display: "flex",
    flexDirection: "column",
    fontFamily: typography.fontFamily,
    height: "100vh",
    maxWidth: "100dvw",
  },
  devWarningBanner: {
    margin: spacing.sm,
    padding: spacing.sm,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    borderStyle: "solid",
    borderWidth: 1,
    backgroundColor: colors.warningBackground,
    color: colors.warningText,
    fontSize: typography.fontSizeSm,
  },
  outletWrapper: {
    flex: "1 1 auto",
    // Scrollbar styling
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: "thin",
    minHeight: 0,
    overflowY: "auto",
  },
});
