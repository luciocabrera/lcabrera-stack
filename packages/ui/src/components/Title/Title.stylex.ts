import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const base = stylex.create({
  container: {
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  toolbar: {
    paddingBlock: spacing.lg,
    paddingInline: spacing.lg,
    backgroundImage: `linear-gradient(to bottom, ${colors.backgroundPrimary}, transparent)`,
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
  plainTitle: {
    margin: 0,
    color: colors.textPrimary,
    lineHeight: 1.2,
  },
  actions: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
});

const plainLevelVariants = stylex.create({
  1: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightBold,
  },
  2: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  3: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightSemibold,
  },
});

export const styles = {
  actions: base.actions,
  container: base.container,
  icon: base.icon,
  plainLevel: plainLevelVariants,
  plainTitle: base.plainTitle,
  title: base.title,
  titleSection: base.titleSection,
  toolbar: base.toolbar,
};
