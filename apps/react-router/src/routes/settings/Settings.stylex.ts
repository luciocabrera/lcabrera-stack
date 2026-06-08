import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  actions: {
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    margin: '0 auto',
    maxWidth: '52rem',
    padding: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  tabSections: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
    margin: 0,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
    margin: 0,
  },
});
