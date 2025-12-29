import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import {
  rippleBase,
  rippleVariants,
} from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  item: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    containerName: 'toolbarLink',
    containerType: 'inline-size',
    cursor: 'pointer',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'center',
    opacity: {
      default: 1,
      ':hover': 0.85,
    },
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    outlineOffset: {
      ':focus-visible': 2,
    },
    textDecoration: 'none',
    transition: `opacity ${transitions.fast}`,
    width: '100%',
  },

  itemActive: {
    backgroundColor: colors.brandPrimaryBackground,
    color: colors.brandPrimary,
    fontWeight: 600,
  },

  itemError: {
    backgroundColor: colors.error,
    color: colors.errorText,
  },

  itemGhost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: colors.textPrimary,
  },

  itemIcon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: 20,
    width: 20,
  },

  itemLabel: {
    '@container toolbarLink (max-width: 60px)': {
      display: 'none',
    },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  itemLg: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    height: '3rem',
    minHeight: '3rem',
  },

  itemMd: {
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    height: '2.5rem',
    minHeight: '2.5rem',
  },

  itemOutline: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.textPrimary,
  },

  itemPrimary: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
  },

  itemSecondary: {
    backgroundColor: colors.brandSecondary,
    color: colors.brandSecondaryText,
  },

  itemSm: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    height: '2rem',
    minHeight: '2rem',
  },

  itemSuccess: {
    backgroundColor: colors.success,
    color: colors.successText,
  },

  itemWarning: {
    backgroundColor: colors.warning,
    color: colors.warningText,
  },
});

export const rippleStyles = {
  base: rippleBase.ripple,
  variants: rippleVariants,
};