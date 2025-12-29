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
    borderRadius: borderRadius.md,
    containerName: 'toolbarLink',
    containerType: 'inline-size',
    cursor: 'pointer',
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'center',
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    outlineOffset: {
      ':focus-visible': 2,
    },
    textDecoration: 'none',
    transition: `background-color ${transitions.fast}, opacity ${transitions.fast}`,
    width: '100%',
    opacity: {
      default: 1,
      ':hover': 0.85,
    },
  },

  itemActive: {
    backgroundColor: colors.brandPrimaryBackground,
    color: colors.brandPrimary,
    fontWeight: 600,
  },

  itemError: {
    backgroundColor: {
      ':hover': colors.errorHover,
      default: colors.error,
    },
    color: colors.errorText,
  },

  itemGhost: {
    backgroundColor: {
      ':hover': colors.hover,
      default: 'transparent',
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
      ':hover': colors.hover,
      default: 'transparent',
    },
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.textPrimary,
  },

  itemPrimary: {
    backgroundColor: {
      ':hover': colors.brandPrimaryHover,
      default: colors.brandPrimary,
    },
    color: colors.brandPrimaryText,
  },

  itemSecondary: {
    backgroundColor: {
      ':hover': colors.brandSecondaryHover,
      default: colors.brandSecondary,
    },
    color: colors.brandSecondaryText,
  },

  itemSm: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    height: '2rem',
    minHeight: '2rem',
  },

  itemSuccess: {
    backgroundColor: {
      ':hover': colors.successHover,
      default: colors.success,
    },
    color: colors.successText,
  },

  itemWarning: {
    backgroundColor: {
      ':hover': colors.warningHover,
      default: colors.warning,
    },
    color: colors.warningText,
  },
});