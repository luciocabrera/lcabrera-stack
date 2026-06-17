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
  tag: {
    padding: `${spacing.xxs} ${spacing.xs}`,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    flex: '1 1 auto',
    gap: spacing.xxs,
    height: spacing.lg,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    display: 'inline-flex',
    fontSize: typography.fontSizeSm,
    justifyContent: 'space-between',
    lineHeight: typography.lineHeightTight,
    minWidth: '1.5rem',
  },
});
