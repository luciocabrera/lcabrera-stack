import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
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
    // borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimaryBackground,
  },
  radio: {
    margin: 0,
    borderColor: colors.borderSecondary,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '1px',
    appearance: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    flexShrink: 0,
    height: '16px',
    // marginTop: '2px',
    width: '16px',
  },
  radioChecked: {
    backgroundColor: colors.brandPrimary,
    boxShadow: 'inset 0 0 0 3px white',
  },
});
