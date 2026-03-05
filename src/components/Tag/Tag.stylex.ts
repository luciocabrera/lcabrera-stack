import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  label: {
    overflow: 'hidden',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeButton: {
    padding: '0.125rem',
    borderColor: 'transparent',
    borderRadius: borderRadius.full,
    borderStyle: 'solid',
    borderWidth: 0,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.error,
    },
    color: {
      default: colors.textSecondary,
      ':hover': colors.errorText,
    },
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
    justifyContent: 'center',
    lineHeight: 1,
    marginLeft: 'auto',
    height: '1rem',
    width: '1rem',
  },
  tag: {
    padding: `${spacing.xxs} ${spacing.xs}`,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    flex: '1 1 auto',
    gap: spacing.xxs,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    display: 'inline-flex',
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightTight,
    minWidth: '1.5rem',
  },
});
