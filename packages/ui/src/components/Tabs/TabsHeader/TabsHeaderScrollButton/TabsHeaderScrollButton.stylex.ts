import * as stylex from '@stylexjs/stylex';

import { spacing, transitions } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  scrollButton: {
    paddingBlock: spacing.sm,
    paddingInline: spacing.xxs,
    transition: `color ${transitions.fast}`,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: {
      default: colors.textSecondary,
      ':hover': colors.textPrimary,
    },
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    borderTopStyle: 'none',
  },
  scrollIcon: {
    alignItems: 'center',
    display: 'inline-flex',
  },
  scrollIconStart: {
    transform: 'rotate(180deg)',
  },
});
