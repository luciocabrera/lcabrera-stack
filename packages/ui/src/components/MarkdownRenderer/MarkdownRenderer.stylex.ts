import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  blockquote: {
    borderInlineStartColor: colors.borderPrimary,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: '3px',
    color: colors.textSecondary,
    marginBlock: spacing.sm,
    paddingInlineStart: spacing.md,
  },
  code: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    fontFamily: 'monospace',
    fontSize: typography.fontSizeSm,
    paddingBlock: '0.125rem',
    paddingInline: spacing.xs,
  },
  container: {
    color: colors.textPrimary,
  },
  heading1: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightBold,
    marginBlock: spacing.md,
  },
  heading2: {
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
    marginBlock: spacing.md,
  },
  heading3: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
    marginBlock: spacing.sm,
  },
  link: {
    color: colors.brandPrimary,
  },
  list: {
    marginBlock: spacing.sm,
    paddingInlineStart: spacing.lg,
  },
  paragraph: {
    lineHeight: 1.6,
    marginBlock: spacing.sm,
  },
  pre: {
    // No own background/padding — react-markdown always nests a <code> (styled
    // by `styles.code` below) inside <pre> for fenced blocks, so the pill
    // background there already provides it. This avoids a doubled-up box.
    borderRadius: borderRadius.md,
    marginBlock: spacing.sm,
    overflowX: 'auto',
  },
});
