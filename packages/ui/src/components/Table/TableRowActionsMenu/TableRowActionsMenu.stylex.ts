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
  menuHidden: {
    visibility: 'hidden',
  },
  menuPosition: (left: number, top: number) => ({
    margin: 0,
    position: 'fixed',
    left,
    top,
  }),
  menuActions: {
    gap: spacing.xxs,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
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
  trigger: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
});
