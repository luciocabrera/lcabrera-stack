import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  spacing,
  transitions,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const formInputStyles = stylex.create({
  input: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.borderFocus,
      ':focus': colors.borderFocus,
    },
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: 'none',
    transition: `border-color ${transitions.fast} ${easing.easeInOut}, box-shadow ${transitions.fast} ${easing.easeInOut}`,
    appearance: 'none',
    backgroundColor: colors.surfacePrimary,
    boxShadow: {
      default: 'none',
      ':focus-visible': `0 0 0 3px ${colors.brandPrimaryBackground}`,
      ':focus': `0 0 0 3px ${colors.brandPrimaryBackground}`,
    },
    boxSizing: 'border-box',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    height: '2.25rem',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    height: '2.25rem',
  },
  field: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  select: {
    appearance: 'auto',
    cursor: {
      default: 'pointer',
      ':disabled': 'not-allowed',
    },
  },
});

export const formInputSizeVariants = stylex.create({
  embedded: {
    borderRadius: borderRadius.sm,
    paddingBlock: 0,
    paddingInline: spacing.xxs,
    fontSize: typography.fontSizeXs,
    height: spacing.lg,
  },
  lg: {
    borderRadius: borderRadius.lg,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    fontSize: typography.fontSizeLg,
    height: spacing.xxl,
  },
  md: {
    borderRadius: borderRadius.md,
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    fontSize: typography.fontSizeMd,
    height: '2.5rem',
  },
  mini: {
    borderRadius: borderRadius.sm,
    paddingBlock: 0,
    paddingInline: spacing.xs,
    fontSize: typography.fontSizeSm,
    height: '1.75rem',
  },
  sm: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    fontSize: typography.fontSizeSm,
    height: spacing.xl,
  },
});
