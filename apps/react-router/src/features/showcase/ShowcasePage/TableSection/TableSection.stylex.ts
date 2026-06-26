import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  controls: {
    alignItems: 'center',
    display: 'flex',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  delayLabel: {
    alignSelf: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  tableContainer: {
    borderRadius: borderRadius.md,
    boxSizing: 'border-box',
    display: 'flex',
    height: '400px',
    maxWidth: '100%',
  },
});
