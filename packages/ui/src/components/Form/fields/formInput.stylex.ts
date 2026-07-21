import {
  borderRadius,
  easing,
  spacing,
  transitions,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * The Form's own leaf-input styles — deliberately separate from the Table's
 * `filterBaseStyles` (`design-system/tokens/filters.stylex`) so Form styling can
 * evolve without the Table-filter blast radius. Tokenized corner radius plus a
 * focus-accent ring (border + soft brand halo) distinguish it from the flatter
 * filter inputs. Consumed by TextField, NumberField, DateField, CurrencyField.
 */
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
