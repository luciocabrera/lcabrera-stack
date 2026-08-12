import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  bodyContent: {
    padding: spacing.sm,
  },
  brand: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
  },
  brandCollapsed: {
    justifyContent: 'center',
    width: '100%',
  },
  brandIcon: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: '2.25rem',
    width: '2.25rem',
  },
  // Matches button height for each density so brand icon is visually consistent
  brandIconSizeMini: {
    height: '1.75rem',
    width: '1.75rem',
  },
  brandIconSizeSm: {
    height: '2rem',
    width: '2rem',
  },
  brandIconSizeMd: {
    height: '2.5rem',
    width: '2.5rem',
  },
  brandText: {
    overflow: 'hidden',
    display: 'block',
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  brandTextHidden: {
    display: 'none',
  },
  bodyDensityCompact: {
    padding: spacing.xs,
  },
  bodyDensityLarge: {
    padding: spacing.md,
  },
  footer: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    padding: spacing.md,
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  headerDensityCompact: {
    padding: spacing.xs,
    gap: spacing.xs,
  },
  headerDensityLarge: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerDensitySmall: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  headerRow: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
});
