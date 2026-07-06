import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  customActions: {
    borderTopColor: colors.borderSecondary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  menu: {
    backgroundColor: colors.surfacePrimary,
    borderColor: colors.borderSecondary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow: shadows.md,
    minWidth: '12rem',
    padding: spacing.xs,
    zIndex: zIndex.popover,
  },
  menuActions: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  trigger: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
});
