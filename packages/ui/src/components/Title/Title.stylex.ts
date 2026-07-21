import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    paddingBlock: spacing.lg,
    paddingInline: spacing.lg,
    alignItems: 'center',
    backgroundImage: `linear-gradient(to bottom, ${colors.backgroundPrimary}, transparent)`,
    display: 'flex',
    justifyContent: 'space-between',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  titleSection: {
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
  },
  icon: {
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'flex',
    fontSize: typography.fontSize2xl,
  },
  title: {
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    backgroundClip: 'text',
    backgroundImage: colors.textGradient,
    color: 'transparent',
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: 1.2,
  },
  actions: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
});
