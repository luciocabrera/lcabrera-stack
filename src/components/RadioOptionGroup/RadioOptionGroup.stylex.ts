import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
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
    borderColor: colors.borderSecondary,
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
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimaryBackground,
  },
  radio: {
    accentColor: colors.brandPrimary,
    cursor: 'pointer',
    flexShrink: 0,
    height: '16px',
    marginTop: '2px',
    width: '16px',
  },
});
