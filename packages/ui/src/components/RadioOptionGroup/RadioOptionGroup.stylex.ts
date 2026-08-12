import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

const localStyles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
  },
  // Layout only — the card surface arrives from `surfaceStyles.interactiveCard`
  // in the export below, so these cards read as the same object as the
  // draggable rows in the settings drawer.
  option: {
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
    cursor: 'pointer',
    display: 'flex',
  },
  // Flat values, so they replace the recipe's `borderColor` and
  // `backgroundColor` keys outright — the recipe's `:hover` fill included.
  // Intended: a chosen card holds its accent rather than lifting under the
  // pointer, which would read as "not yet selected".
  optionSelected: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandPrimaryBackground,
  },
  // The focus ring lives on the input rather than the card because the input is
  // what actually takes focus; `<label>` never does, so `:focus-visible` on the
  // card would never match.
  radio: {
    margin: 0,
    borderColor: colors.borderSecondary,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.brandPrimary}`,
    },
    appearance: 'none',
    backgroundColor: colors.surfacePrimary,
    cursor: 'pointer',
    flexShrink: 0,
    outlineOffset: {
      default: '0px',
      ':focus-visible': '2px',
    },
    height: '16px',
    width: '16px',
  },
  radioChecked: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandSecondary,
    boxShadow: `inset 0 0 0 3px ${colors.brandPrimaryBackground}`,
  },
});

export const styles = {
  ...localStyles,
  option: { ...surfaceStyles.interactiveCard, ...localStyles.option },
};
