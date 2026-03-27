import * as stylex from "@stylexjs/stylex";

import { spacing, typography } from "@/design-system/tokens/base.stylex";

export const cardDescriptionStyles = stylex.create({
  description: {
    margin: 0,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    marginTop: spacing.xs,
  },
});
