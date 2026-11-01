import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  list: {
    margin: 0,
    padding: 0,
    gap: spacing.xxs,
    listStyle: 'none',
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizeSm,
  },
  item: {
    gap: spacing.xxs,
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'inline-flex',
  },
  link: {
    borderRadius: borderRadius.sm,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.brandPrimaryCardText}`,
    },
    color: colors.textSecondary,
    outlineOffset: '2px',
    textDecorationLine: {
      default: 'none',
      ':focus-visible': 'underline',
      ':hover': 'underline',
    },
    textUnderlineOffset: '0.2em',
  },
  current: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeightMedium,
  },
  separator: {
    color: colors.textTertiary,
    userSelect: 'none',
  },
});
