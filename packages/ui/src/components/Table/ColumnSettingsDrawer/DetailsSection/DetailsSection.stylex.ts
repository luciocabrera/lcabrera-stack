import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  badge: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    display: 'inline-block',
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightMedium,
    lineHeight: 1,
  },
  badgeNo: {
    backgroundColor: colors.errorBackground,
    color: colors.errorText,
  },
  badgeNone: {
    backgroundColor: colors.backgroundTertiary,
    color: colors.textSecondary,
  },
  badgeYes: {
    backgroundColor: colors.successBackground,
    color: colors.successText,
  },
  container: {
    gap: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    paddingBlock: spacing.sm,
    paddingInline: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightMedium,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.fontSizeXs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
    textAlign: 'right',
  },
});
