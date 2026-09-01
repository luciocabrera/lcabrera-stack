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
});
