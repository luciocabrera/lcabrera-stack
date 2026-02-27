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
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeButton: {
    background: 'none',
    padding: 0,
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 0,
    appearance: 'none',
    color: colors.textSecondary,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
    lineHeight: 1,
  },
  tag: {
    padding: `0 ${spacing.xs}`,
    borderRadius: borderRadius.sm,
    gap: spacing.xxs,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    display: 'inline-flex',
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightTight,
    maxWidth: '10rem',
  },
});
