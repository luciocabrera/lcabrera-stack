import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
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
  option: {
    padding: spacing.md,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.sm,
    transition: 'background-color 0.15s, border-color 0.15s',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
  },
  optionSelected: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandPrimaryBackground,
  },
  radio: {
    margin: 0,
    borderColor: colors.borderSecondary,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '1px',
    appearance: 'none',
    backgroundColor: colors.surfacePrimary,
    cursor: 'pointer',
    flexShrink: 0,
    height: '16px',
    width: '16px',
  },
  radioChecked: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandSecondary,
    boxShadow: `inset 0 0 0 3px ${colors.brandPrimaryBackground}`,
  },
});
