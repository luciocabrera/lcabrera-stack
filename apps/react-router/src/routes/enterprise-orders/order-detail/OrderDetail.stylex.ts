import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.xl,
    marginInline: 'auto',
    maxWidth: '1200px',
  },
  header: {
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
  },
  orderNumber: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightBold,
  },
  badge: {
    padding: `${spacing.xxs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    display: 'inline-flex',
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightSemibold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  badgeDelivered: {
    backgroundColor: colors.successBackground,
    color: colors.successText,
  },
  badgeShipped: {
    backgroundColor: colors.infoBackground,
    color: colors.infoText,
  },
  badgePending: {
    backgroundColor: 'rgb(255 243 205)',
    color: 'rgb(133 100 4)',
  },
  badgeCancelled: {
    backgroundColor: colors.errorBackground,
    color: colors.errorText,
  },
  badgeDefault: {
    backgroundColor: colors.backgroundSecondary,
    color: colors.textSecondary,
  },
  grid: {
    gap: spacing.lg,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  fieldGroup: {
    gap: spacing.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  },
  field: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightMedium,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
  },
  notesText: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightRelaxed,
    whiteSpace: 'pre-wrap',
  },
  emptyValue: {
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  backLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
});
