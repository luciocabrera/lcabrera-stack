import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  blockquote: {
    marginBlock: spacing.sm,
    borderInlineStartColor: colors.borderPrimary,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: '3px',
    color: colors.textSecondary,
    paddingInlineStart: spacing.md,
  },
  code: {
    borderRadius: borderRadius.sm,
    paddingBlock: '0.125rem',
    paddingInline: spacing.xs,
    backgroundColor: colors.backgroundTertiary,
    fontFamily: 'monospace',
    fontSize: typography.fontSizeSm,
  },
  container: {
    color: colors.textPrimary,
  },
  heading1: {
    marginBlock: spacing.md,
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightBold,
  },
  heading2: {
    marginBlock: spacing.md,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
  },
  heading3: {
    marginBlock: spacing.sm,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  link: {
    color: colors.brandPrimary,
  },
  list: {
    marginBlock: spacing.sm,
    paddingInlineStart: spacing.lg,
  },
  paragraph: {
    marginBlock: spacing.sm,
    lineHeight: 1.6,
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
