import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  item: {
    alignItems: 'center',
    backgroundColor: {
      ':hover': colors.hover,
      default: 'transparent',
    },
    borderRadius: borderRadius.md,
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'flex-start',
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    outlineOffset: {
      ':focus-visible': 2,
    },
    textDecoration: 'none',
    transition: `background-color ${transitions.fast}`,
    width: '100%',
  },

  itemActive: {
    backgroundColor: colors.brandPrimaryBackground,
    color: colors.brandPrimary,
    fontWeight: 600,
  },

  itemIcon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },

  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  itemLg: {
    minHeight: '3rem',
    height: '3rem',
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
  },

  itemMd: {
    minHeight: '2.5rem',
    height: '2.5rem',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
  },

  itemSm: {
    minHeight: '2rem',
    height: '2rem',
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
  },
});

