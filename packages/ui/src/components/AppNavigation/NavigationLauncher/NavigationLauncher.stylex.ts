import * as stylex from '@stylexjs/stylex';

import { shadows, spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const launcherStyles = stylex.create({
  launcher: {
    padding: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.md,
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    borderRightColor: colors.borderPrimary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    width: '4.5rem',
  },
  railControl: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: '2.5rem',
    width: '2.5rem',
  },
});
