import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  bodyContent: {
    padding: spacing.sm,
  },
  brand: {
    gap: spacing.sm,
    minWidth: 0,
    alignItems: 'center',
    display: 'flex',
  },
  brandCollapsed: {
    justifyContent: 'center',
    width: '100%',
  },
  brandIcon: {
    alignItems: 'center',
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
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
    minWidth: 0,
    overflow: 'hidden',
    display: 'block',
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    padding: spacing.md,
    gap: spacing.md,
    flexShrink: 0,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerActions: {
    gap: spacing.xs,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  headerActionsCollapsed: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerDensityCompact: {
    gap: spacing.xs,
    padding: spacing.xs,
  },
  headerDensityLarge: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerDensitySmall: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  headerRow: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  launcher: {
    padding: spacing.sm,
    alignItems: 'flex-start',
    borderRightColor: colors.borderPrimary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    backgroundColor: colors.surfacePrimary,
    boxSizing: 'border-box',
    boxShadow: shadows.md,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    width: '4.5rem',
  },
  railControl: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: '2.5rem',
    width: '2.5rem',
  },
});
