import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';

export const tableDensityVars = stylex.defineVars({
  bodyFontSize: typography.fontSizeSm,
  bodyPaddingInline: spacing.xs,
  headerBandFontSize: typography.fontSizeXs,
  headerFontSize: typography.fontSizeSm,
  headerPaddingInline: spacing.xs,
});
