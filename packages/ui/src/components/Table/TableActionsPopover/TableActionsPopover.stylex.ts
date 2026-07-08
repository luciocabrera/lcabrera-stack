import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  menu: {
    padding: spacing.xs,
    borderColor: colors.borderSecondary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    backdropFilter: 'none',
    backgroundColor: '#0f172a',
    boxShadow: shadows.md,
    opacity: 1,
    zIndex: zIndex.popover,
    minWidth: '12rem',
  },
  menuActions: {
    gap: spacing.xxs,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  menuHidden: {
    visibility: 'hidden',
  },
  menuIcon: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minWidth: '1rem',
  },
  menuItem: {
    justifyContent: 'flex-start',
    textAlign: 'left',
  },
  menuPosition: (left: number, top: number) => ({
    margin: 0,
    position: 'fixed',
    left,
    top,
  }),
  trigger: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
});
