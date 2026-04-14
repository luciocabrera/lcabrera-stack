import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from './design-system/tokens/base.stylex';
import { colors } from './design-system/tokens/colors.stylex';

export const styles = stylex.create({
  app: {
    transition: 'background-color 0.3s ease, color 0.3s ease',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    // Scrollbar styling
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: '100vh',
  },

  buttonGrid: {
    gap: spacing.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    marginBottom: spacing.xl,
  },

  cardGrid: {
    gap: spacing.lg,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  },

  container: {
    margin: '0 auto',
    padding: spacing.xl,
    maxWidth: '1200px',
  },

  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },

  section: {
    marginBottom: spacing.xxxl,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightSemibold,
    marginBottom: spacing.lg,
  },

  subsection: {
    marginBottom: spacing.xl,
  },

  subsectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightMedium,
    marginBottom: spacing.md,
  },

  title: {
    margin: 0,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.fontWeightBold,
  },
});
