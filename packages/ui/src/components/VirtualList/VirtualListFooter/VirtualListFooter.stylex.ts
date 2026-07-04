import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  footer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    height: spacing.xl,
  },
  loadedCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    textAlign: 'left',
  },
  listFilterGroup: {
    borderRadius: borderRadius.sm,
    gap: spacing.xxs,
    overflow: 'hidden',
    display: 'flex',
  },
});
